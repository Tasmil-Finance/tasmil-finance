import { Buffer } from "node:buffer";
import { buildManifest, hashContent, type S3Like, uploadFile } from "./upload-assets";

describe("hashContent", () => {
  it("produces a 12-char hex hash deterministic per content", () => {
    const a = hashContent(Buffer.from("hello"));
    const b = hashContent(Buffer.from("hello"));
    const c = hashContent(Buffer.from("world"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe("buildManifest", () => {
  it("groups files by prefix and emits CDN URLs keyed by uppercase basename", () => {
    const cdnEndpoint = "https://tasmil-assets.sgp1.cdn.digitaloceanspaces.com";
    const entries = [
      { prefix: "tokens" as const, basename: "usdc", ext: "png", hash: "aaaaaaaaaaaa" },
      { prefix: "tokens" as const, basename: "xlm", ext: "png", hash: "bbbbbbbbbbbb" },
      { prefix: "protocols" as const, basename: "blend", ext: "svg", hash: "cccccccccccc" },
    ];

    const manifest = buildManifest(entries, cdnEndpoint);

    expect(manifest).toEqual({
      tokens: {
        USDC: "https://tasmil-assets.sgp1.cdn.digitaloceanspaces.com/static/tokens/aaaaaaaaaaaa.png",
        XLM: "https://tasmil-assets.sgp1.cdn.digitaloceanspaces.com/static/tokens/bbbbbbbbbbbb.png",
      },
      protocols: {
        blend:
          "https://tasmil-assets.sgp1.cdn.digitaloceanspaces.com/static/protocols/cccccccccccc.svg",
      },
    });
  });

  it("strips file extensions from token keys but keeps protocol keys lowercase", () => {
    const entries = [
      { prefix: "tokens" as const, basename: "usdc", ext: "png", hash: "aaaaaaaaaaaa" },
      { prefix: "protocols" as const, basename: "Blend-Capital", ext: "svg", hash: "bbbbbbbbbbbb" },
    ];

    const m = buildManifest(entries, "https://cdn.test");

    expect(Object.keys(m.tokens)).toEqual(["USDC"]);
    expect(Object.keys(m.protocols)).toEqual(["blend-capital"]);
  });
});

describe("uploadFile (idempotent)", () => {
  let s3: S3Like;
  let sendMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest.fn();
    s3 = { send: sendMock as never };
  });

  it("issues a HEAD and skips PUT when the object already exists", async () => {
    sendMock.mockResolvedValueOnce({}); // HEAD ok = exists

    const skipped = await uploadFile({
      s3,
      bucket: "tasmil-assets",
      key: "static/tokens/abc.png",
      body: Buffer.from("x"),
      contentType: "image/png",
    });

    expect(skipped).toBe("skipped");
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("issues HEAD then PUT when the object does not exist (404)", async () => {
    sendMock
      .mockRejectedValueOnce(Object.assign(new Error("Not Found"), { name: "NotFound" }))
      .mockResolvedValueOnce({}); // PUT ok

    const result = await uploadFile({
      s3,
      bucket: "tasmil-assets",
      key: "static/tokens/abc.png",
      body: Buffer.from("x"),
      contentType: "image/png",
    });

    expect(result).toBe("uploaded");
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
