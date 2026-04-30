import type { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface ManifestEntry {
  prefix: "tokens" | "protocols";
  basename: string;
  ext: string;
  hash: string;
}

export interface AssetManifest {
  tokens: Record<string, string>;
  protocols: Record<string, string>;
}

export interface S3Like {
  send: (command: unknown) => Promise<unknown>;
}

export function hashContent(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 12);
}

export function buildManifest(entries: ManifestEntry[], cdnEndpoint: string): AssetManifest {
  const manifest: AssetManifest = { tokens: {}, protocols: {} };
  for (const e of entries) {
    const url = `${cdnEndpoint.replace(/\/$/, "")}/static/${e.prefix}/${e.hash}.${e.ext}`;
    if (e.prefix === "tokens") {
      manifest.tokens[e.basename.toUpperCase()] = url;
    } else {
      manifest.protocols[e.basename.toLowerCase()] = url;
    }
  }
  return manifest;
}

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  gif: "image/gif",
};

interface UploadFileOpts {
  s3: S3Like;
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}

export async function uploadFile(opts: UploadFileOpts): Promise<"uploaded" | "skipped"> {
  // Idempotent: HEAD first; if exists, skip.
  try {
    await opts.s3.send(new HeadObjectCommand({ Bucket: opts.bucket, Key: opts.key }));
    return "skipped";
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name !== "NotFound" && e.$metadata?.httpStatusCode !== 404) {
      throw err;
    }
  }
  await opts.s3.send(
    new PutObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: "public, max-age=31536000, immutable",
      ACL: "public-read",
    })
  );
  return "uploaded";
}

interface RunOpts {
  publicDir: string;
  manifestPath: string;
  prefixes: { dir: string; key: "tokens" | "protocols" }[];
  bucket: string;
  cdnEndpoint: string;
  s3: S3Like;
}

export async function run(opts: RunOpts): Promise<{
  uploaded: number;
  skipped: number;
  manifest: AssetManifest;
}> {
  let uploaded = 0;
  let skipped = 0;
  const entries: ManifestEntry[] = [];

  for (const p of opts.prefixes) {
    const dir = join(opts.publicDir, p.dir);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      console.warn(`[upload-assets] skip missing dir: ${dir}`);
      continue;
    }
    for (const f of files) {
      const ext = extname(f).slice(1).toLowerCase();
      if (!CONTENT_TYPES[ext]) continue;
      const basename = f.slice(0, -extname(f).length);
      const buf = await readFile(join(dir, f));
      const hash = hashContent(buf);
      const key = `static/${p.key}/${hash}.${ext}`;

      const result = await uploadFile({
        s3: opts.s3,
        bucket: opts.bucket,
        key,
        body: buf,
        contentType: CONTENT_TYPES[ext],
      });

      if (result === "uploaded") uploaded++;
      else skipped++;

      entries.push({ prefix: p.key, basename, ext, hash });
    }
  }

  const manifest = buildManifest(entries, opts.cdnEndpoint);

  // Atomic write: tmp + rename. Write to two locations:
  //   1. src/shared/constants/asset-manifest.json (typed import for components)
  //   2. public/asset-manifest.json              (browser-fetchable for SW install)
  const targets = [opts.manifestPath, join(opts.publicDir, "asset-manifest.json")];
  const { rename } = await import("node:fs/promises");
  for (const target of targets) {
    const tmp = `${target}.tmp`;
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(tmp, JSON.stringify(manifest, null, 2));
    await rename(tmp, target);
  }

  return { uploaded, skipped, manifest };
}

// CLI entry — only runs when invoked directly, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  const required = [
    "DO_SPACES_KEY",
    "DO_SPACES_SECRET",
    "DO_SPACES_BUCKET",
    "DO_SPACES_REGION",
    "DO_SPACES_ENDPOINT",
    "DO_SPACES_CDN_ENDPOINT",
  ] as const;
  for (const k of required) {
    if (!process.env[k]) {
      console.error(`Missing env var: ${k}`);
      process.exit(1);
    }
  }

  const s3 = new S3Client({
    region: process.env.DO_SPACES_REGION as string,
    endpoint: process.env.DO_SPACES_ENDPOINT as string,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY as string,
      secretAccessKey: process.env.DO_SPACES_SECRET as string,
    },
    forcePathStyle: false,
  });

  run({
    publicDir: join(process.cwd(), "public"),
    manifestPath: join(process.cwd(), "src/shared/constants/asset-manifest.json"),
    prefixes: [
      { dir: "token", key: "tokens" },
      { dir: "protocols", key: "protocols" },
    ],
    bucket: process.env.DO_SPACES_BUCKET as string,
    cdnEndpoint: process.env.DO_SPACES_CDN_ENDPOINT as string,
    s3,
  })
    .then((r) => {
      console.log(`uploaded=${r.uploaded} skipped=${r.skipped}`);
      console.log(
        `manifest: tokens=${Object.keys(r.manifest.tokens).length} protocols=${Object.keys(r.manifest.protocols).length}`
      );
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
