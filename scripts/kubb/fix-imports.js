#!/usr/bin/env node

/**
 * Script to fix import paths in generated Kubb files.
 * Supports multiple gen targets via --dir= argument.
 *
 * Usage:
 *   node fix-imports.js                         -> fixes src/gen   (@/gen/)
 *   node fix-imports.js --dir=src/gen-backend   -> fixes src/gen-backend (@/gen-backend/)
 */

const fs = require("node:fs");
const path = require("node:path");

// Accept --dir=src/gen-backend to support multiple gen targets
const dirArg = process.argv.find((a) => a.startsWith("--dir="));
const GEN_RELATIVE = dirArg ? dirArg.split("=")[1] : "src/gen-ai";
const GEN_DIR = path.join(__dirname, "../..", GEN_RELATIVE);
// Derive the TS import alias: src/gen -> @/gen, src/gen-backend -> @/gen-backend
const GEN_ALIAS = "@/" + GEN_RELATIVE.replace(/^src\//, "");

function getAllTsFiles(dir) {
  const files = [];
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (item !== ".kubb") traverse(fullPath);
      } else if (item.endsWith(".ts") || item.endsWith(".tsx")) {
        files.push(fullPath);
      }
    }
  }
  traverse(dir);
  return files;
}

function findTypeFile(typeName) {
  const possiblePaths = [
    path.join(GEN_DIR, "types", `${typeName}.ts`),
    path.join(GEN_DIR, `${typeName}.ts`),
    path.join(GEN_DIR, "client", `${typeName}.ts`),
    path.join(GEN_DIR, "hooks", `${typeName}.ts`),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return path.relative(GEN_DIR, p).replace(/\\/g, "/").replace(/\.ts$/, "");
    }
  }
  return null;
}

function fixClientIndexFile(filePath) {
  console.log("🔧 Fixing client index.ts exports...");
  const clientDir = path.dirname(filePath);
  const clientFiles = fs
    .readdirSync(clientDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => file.replace(".ts", ""));

  const exports = [];
  for (const fileName of clientFiles) {
    const clientFilePath = path.join(clientDir, `${fileName}.ts`);
    const content = fs.readFileSync(clientFilePath, "utf8");
    const exportMatch = content.match(/export\s+async\s+function\s+(\w+)/);
    if (exportMatch) {
      exports.push(`export { ${exportMatch[1]} } from "${GEN_ALIAS}/client/${fileName}";`);
    }
  }

  fs.writeFileSync(filePath, `${exports.join("\n")}\n`, "utf8");
  console.log(`✅ Fixed client/index.ts with ${exports.length} exports`);
  return true;
}

function fixRootIndexFile(filePath) {
  console.log("🔧 Fixing root index.ts exports...");
  const content = fs.readFileSync(filePath, "utf8");
  let fixedContent = content;
  let modified = false;

  fixedContent = fixedContent.replace(/from\s+["']\.\/([^"']+)["']/g, (_match, rel) => {
    modified = true;
    return `from "${GEN_ALIAS}/${rel.replace(/\.(ts|tsx)$/, "")}"`;
  });
  fixedContent = fixedContent.replace(/from\s+["']\.\.\/([^"']+)["']/g, (_match, rel) => {
    modified = true;
    return `from "${GEN_ALIAS}/${rel.replace(/\.(ts|tsx)$/, "")}"`;
  });

  const aliasRegex = new RegExp(GEN_ALIAS.replace(/\//g, "\\/"), "g");
  if (fixedContent.includes(GEN_ALIAS) && (fixedContent.includes('.ts"') || fixedContent.includes(".ts'"))) {
    fixedContent = fixedContent.replace(new RegExp(`(${escapeRegex(GEN_ALIAS)}/[^"']+)\\.ts(["'])`, "g"), "$1$2");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, fixedContent, "utf8");
    console.log("✅ Fixed root index.ts");
    return true;
  }
  return false;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  const isIndexFile = path.basename(filePath) === "index.ts";
  const isClientIndex = filePath.includes("/client/index.ts");
  const isRootIndex = filePath === path.join(GEN_DIR, "index.ts");

  if (isClientIndex) return fixClientIndexFile(filePath);
  if (isRootIndex) return fixRootIndexFile(filePath);

  const lines = content.split("\n");
  const fixedLines = lines.map((line) => {
    let fixedLine = line;

    const isImportLine = line.trim().startsWith("import") && line.includes("from");
    const isExportLine = isIndexFile && line.trim().startsWith("export") && line.includes("from");

    if (isImportLine || isExportLine) {
      // ../foo -> @/gen.../foo
      fixedLine = fixedLine.replace(/["']\.\.\/([^"']+)["']/g, (_, rel) => {
        modified = true;
        return `"${GEN_ALIAS}/${rel.replace(/\.(ts|tsx)$/, "")}"`;
      });
      // ./foo -> @/gen.../foo
      fixedLine = fixedLine.replace(/["']\.\/([^"']+)["']/g, (_, rel) => {
        modified = true;
        return `"${GEN_ALIAS}/${rel.replace(/\.(ts|tsx)$/, "")}"`;
      });

      // Fix bare @/gen/TypeName -> find correct subdir
      const bareAliasPattern = new RegExp(`"${escapeRegex(GEN_ALIAS)}/([^/"']+)"`, "g");
      fixedLine = fixedLine.replace(bareAliasPattern, (match, typeName) => {
        if (typeName.includes("/")) return match;
        const correctPath = findTypeFile(typeName);
        if (correctPath) {
          modified = true;
          return `"${GEN_ALIAS}/${correctPath}"`;
        }
        return match;
      });

      // Fix @/gen/client/X -> @/gen/types/X when file only exists in types
      const clientPattern = new RegExp(`"${escapeRegex(GEN_ALIAS)}/client/([^"]+)"`, "g");
      fixedLine = fixedLine.replace(clientPattern, (match, fileName) => {
        const typesPath = path.join(GEN_DIR, "types", `${fileName}.ts`);
        const clientPath = path.join(GEN_DIR, "client", `${fileName}.ts`);
        if (fs.existsSync(typesPath) && !fs.existsSync(clientPath)) {
          modified = true;
          return `"${GEN_ALIAS}/types/${fileName}"`;
        }
        return match;
      });

      // Strip leftover .ts extensions from alias imports
      if (fixedLine.includes(GEN_ALIAS) && (fixedLine.includes('.ts"') || fixedLine.includes(".ts'"))) {
        fixedLine = fixedLine.replace(new RegExp(`(${escapeRegex(GEN_ALIAS)}/[^"']+)\\.ts(["'])`, "g"), "$1$2");
        modified = true;
      }
    }

    return fixedLine;
  });

  if (modified) {
    fs.writeFileSync(filePath, fixedLines.join("\n"), "utf8");
    return true;
  }
  return false;
}

function main() {
  console.log(`🔧 Fixing imports in: ${GEN_DIR} (alias: ${GEN_ALIAS})`);

  if (!fs.existsSync(GEN_DIR)) {
    console.error("❌ Generated files directory not found:", GEN_DIR);
    process.exit(1);
  }

  const tsFiles = getAllTsFiles(GEN_DIR);
  console.log(`📁 Found ${tsFiles.length} TypeScript files`);

  let fixedCount = 0;
  for (const filePath of tsFiles) {
    const relativePath = path.relative(GEN_DIR, filePath);
    try {
      if (fixImportsInFile(filePath)) {
        console.log(`✅ Fixed: ${relativePath}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error fixing ${relativePath}:`, error.message);
    }
  }

  console.log(`\n🎉 Done! ${fixedCount}/${tsFiles.length} files fixed`);
}

main();
