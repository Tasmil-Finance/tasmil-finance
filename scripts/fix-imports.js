import { readdir, readFile, writeFile, unlink } from 'fs/promises';
import { join, relative, dirname, normalize } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// tasmil-monorepo doesn't have src/ folder, gen is at root level
const genDir = join(__dirname, '../gen');
const rootDir = join(__dirname, '..'); // Root of frontend app

/**
 * Convert relative path to absolute path using @/gen/ prefix
 * @param {string} relativePath - Relative path like "../../types/..." or "../client/..."
 * @param {string} fromFile - Full path of the file that contains the import
 * @returns {string} Absolute path like "@/gen/types/..." or "@/gen/client/..."
 */
function toAbsolutePath(relativePath, fromFile) {
  // Get directory of the file that contains the import
  const fromDir = dirname(fromFile);
  
  // Resolve the relative path to absolute
  const absolutePath = normalize(join(fromDir, relativePath));
  
  // Get relative path from root directory (not src/)
  const relativeFromRoot = relative(rootDir, absolutePath);
  
  // Convert to @/gen/... format
  // Remove leading ./ or ../ and ensure it starts with gen/
  let genPath = relativeFromRoot.replace(/^\.\.?\//, '').replace(/\\/g, '/');
  
  // If it doesn't start with gen/, add it
  if (!genPath.startsWith('gen/')) {
    genPath = `gen/${genPath}`;
  }
  
  return `@/${genPath}`;
}

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

async function fixImportsInFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Convert relative imports to absolute imports with @/gen/
    // Match: from "../../types/..." or from "../client/..." or from "./..."
    // Also handle .ts extension
    content = content.replace(
      /from\s+["'](\.\.?\/[^"']+?)(?:\.ts)?["']/g,
      (match, relativePath) => {
        // Skip if it's already an absolute path or node_modules
        if (relativePath.startsWith('@/') || relativePath.includes('node_modules')) {
          return match;
        }
        
        // Remove .ts extension if present
        const cleanPath = relativePath.replace(/\.ts$/, '');
        
        // Convert to absolute path
        const absolutePath = toAbsolutePath(cleanPath, filePath);
        return `from "${absolutePath}"`;
      }
    );
    
    // Also handle type imports - more flexible regex
    content = content.replace(
      /import\s+type\s+[^"']+\s+from\s+["'](\.\.?\/[^"']+?)(?:\.ts)?["']/g,
      (match, relativePath) => {
        if (relativePath.startsWith('@/') || relativePath.includes('node_modules')) {
          return match;
        }
        
        // Remove .ts extension if present
        const cleanPath = relativePath.replace(/\.ts$/, '');
        const absolutePath = toAbsolutePath(cleanPath, filePath);
        return match.replace(/["'](\.\.?\/[^"']+?)(?:\.ts)?["']/, `"${absolutePath}"`);
      }
    );
    
    if (content !== originalContent) {
      await writeFile(filePath, content, 'utf-8');
      console.log(`Fixed imports in: ${filePath.replace(genDir, '')}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function renameSchemasFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await renameSchemasFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const kebabName = toKebabCase(entry.name.replace(/\.json$/, '')) + '.json';
        if (entry.name !== kebabName) {
          const newPath = join(dir, kebabName);
          // Check if new file already exists
          try {
            await readFile(newPath, 'utf-8');
            // If it exists, just delete the old one
            await unlink(fullPath);
            console.log(`Deleted duplicate: ${entry.name} (${kebabName} already exists)`);
          } catch {
            // New file doesn't exist, rename
            const content = await readFile(fullPath, 'utf-8');
            await writeFile(newPath, content, 'utf-8');
            await unlink(fullPath);
            console.log(`Renamed: ${entry.name} → ${kebabName}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error renaming schemas in ${dir}:`, error.message);
  }
}

async function processDirectory(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        await fixImportsInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

async function main() {
  console.log('Fixing imports and renaming schemas...');
  
  // First, rename schemas files to kebab-case
  const schemasDir = join(genDir, 'schemas');
  await renameSchemasFiles(schemasDir);
  
  // Then, fix imports in all TypeScript files
  await processDirectory(genDir);
  console.log('Done!');
}

main().catch(console.error);

