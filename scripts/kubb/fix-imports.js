#!/usr/bin/env node

/**
 * Script to fix import paths in generated Kubb files
 * - Convert relative paths (./ ../) to absolute paths (@/gen/)
 * - Remove .ts extensions from imports
 * - Fix incorrect @/gen/ paths to point to correct subdirectories
 * - Fix client/index.ts exports to import from client files instead of types
 * - Fix all @/gen/ paths to use correct subdirectories
 */

const fs = require('fs');
const path = require('path');

const GEN_DIR = path.join(__dirname, '../../src/gen');

function getAllTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip .kubb directory
        if (item !== '.kubb') {
          traverse(fullPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function findTypeFile(typeName) {
  // Common locations for types
  const possiblePaths = [
    path.join(GEN_DIR, 'types', `${typeName}.ts`),
    path.join(GEN_DIR, `${typeName}.ts`),
    path.join(GEN_DIR, 'client', `${typeName}.ts`),
    path.join(GEN_DIR, 'hooks', `${typeName}.ts`),
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      // Return relative path from gen directory
      return path.relative(GEN_DIR, possiblePath).replace(/\\/g, '/').replace(/\.ts$/, '');
    }
  }
  
  return null;
}

function fixClientIndexFile(filePath) {
  console.log('🔧 Fixing client index.ts exports...');
  
  const clientDir = path.dirname(filePath);
  const clientFiles = fs.readdirSync(clientDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .map(file => file.replace('.ts', ''));
  
  // Read each client file to get the exported function name
  const exports = [];
  
  for (const fileName of clientFiles) {
    const clientFilePath = path.join(clientDir, `${fileName}.ts`);
    const content = fs.readFileSync(clientFilePath, 'utf8');
    
    // Find export function name using regex
    const exportMatch = content.match(/export\s+async\s+function\s+(\w+)/);
    if (exportMatch) {
      const functionName = exportMatch[1];
      // Use absolute path instead of relative path
      exports.push(`export { ${functionName} } from "@/gen/client/${fileName}";`);
    }
  }
  
  // Write the new index.ts content
  const newContent = exports.join('\n') + '\n';
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log(`✅ Fixed client/index.ts with ${exports.length} exports using absolute paths`);
  return true;
}

function fixRootIndexFile(filePath) {
  console.log('🔧 Fixing root index.ts exports...');
  
  const content = fs.readFileSync(filePath, 'utf8');
  let fixedContent = content;
  let modified = false;
  
  // Fix all relative paths to absolute paths and remove .ts extensions
  // Pattern: from "./types/..." -> from "@/gen/types/..."
  fixedContent = fixedContent.replace(/from\s+["']\.\/([^"']+)["']/g, (match, relativePath) => {
    // Remove .ts/.tsx extension if present
    const cleanPath = relativePath.replace(/\.(ts|tsx)$/, '');
    modified = true;
    return `from "@/gen/${cleanPath}"`;
  });
  
  // Pattern: from "../types/..." -> from "@/gen/types/..."
  fixedContent = fixedContent.replace(/from\s+["']\.\.\/([^"']+)["']/g, (match, relativePath) => {
    // Remove .ts/.tsx extension if present
    const cleanPath = relativePath.replace(/\.(ts|tsx)$/, '');
    modified = true;
    return `from "@/gen/${cleanPath}"`;
  });
  
  // Fix any remaining .ts extensions in @/gen/ imports
  if (fixedContent.includes('@/gen/') && (fixedContent.includes('.ts"') || fixedContent.includes(".ts'"))) {
    fixedContent = fixedContent.replace(/(@\/gen\/[^"']+)\.ts(["'])/g, '$1$2');
    modified = true;
  }
  
  // Also fix any remaining .ts extensions in relative paths
  if (fixedContent.includes('.ts"') || fixedContent.includes(".ts'")) {
    fixedContent = fixedContent.replace(/([^@\/][^"']+)\.ts(["'])/g, '$1$2');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('✅ Fixed root index.ts imports and extensions');
    return true;
  }
  
  return false;
}

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // For index.ts files, we need special handling
  const isIndexFile = path.basename(filePath) === 'index.ts';
  const isClientIndex = filePath.includes('/client/index.ts');
  const isRootIndex = filePath === path.join(GEN_DIR, 'index.ts');
  
  // Handle client index specially
  if (isClientIndex) {
    return fixClientIndexFile(filePath);
  }
  
  // Handle root index specially
  if (isRootIndex) {
    return fixRootIndexFile(filePath);
  }
  
  // Split content into lines for processing
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    let fixedLine = line;
    
    // Check if line contains import statement
    if (line.trim().startsWith('import') && line.includes('from')) {
      
      // Fix relative paths to absolute paths
      // Pattern: "../types/..." -> "@/gen/types/..."
      fixedLine = fixedLine.replace(/["']\.\.\/([^"']+)["']/g, (_, relativePath) => {
        // Remove .ts/.tsx extension if present
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, '');
        modified = true;
        return `"@/gen/${cleanPath}"`;
      });
      
      // Pattern: "./..." -> "@/gen/..."
      fixedLine = fixedLine.replace(/["']\.\/([^"']+)["']/g, (_, relativePath) => {
        // Remove .ts/.tsx extension if present
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, '');
        modified = true;
        return `"@/gen/${cleanPath}"`;
      });
      
      // Fix @/gen/ paths that don't include subdirectories
      fixedLine = fixedLine.replace(/"@\/gen\/([^/"']+)"/g, (match, typeName) => {
        // Skip if it already has a subdirectory
        if (typeName.includes('/')) {
          return match;
        }
        
        // Find the correct path for this type
        const correctPath = findTypeFile(typeName);
        if (correctPath) {
          modified = true;
          return `"@/gen/${correctPath}"`;
        }
        
        return match;
      });
      
      // Fix specific known path issues
      // Fix paths that should point to types but are pointing to client
      fixedLine = fixedLine.replace(/"@\/gen\/client\/([^"]+)"/g, (match, fileName) => {
        // Check if this file actually exists in types instead of client
        const typesPath = path.join(GEN_DIR, 'types', `${fileName}.ts`);
        const clientPath = path.join(GEN_DIR, 'client', `${fileName}.ts`);
        
        if (fs.existsSync(typesPath) && !fs.existsSync(clientPath)) {
          modified = true;
          return `"@/gen/types/${fileName}"`;
        }
        return match;
      });
      
      // Also fix any remaining .ts extensions in @/gen/ imports
      if (fixedLine.includes('@/gen/') && (fixedLine.includes('.ts"') || fixedLine.includes(".ts'"))) {
        fixedLine = fixedLine.replace(/(@\/gen\/[^"']+)\.ts(["'])/g, '$1$2');
        modified = true;
      }
    }
    
    // For index.ts files, also fix export statements
    if (isIndexFile && (line.trim().startsWith('export') && line.includes('from'))) {
      
      // Fix relative paths in export statements
      // Pattern: from "./types/..." -> from "@/gen/types/..."
      fixedLine = fixedLine.replace(/from\s+["']\.\/([^"']+)["']/g, (_, relativePath) => {
        // Remove .ts/.tsx extension if present
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, '');
        modified = true;
        return `from "@/gen/${cleanPath}"`;
      });
      
      // Pattern: from "../types/..." -> from "@/gen/types/..."
      fixedLine = fixedLine.replace(/from\s+["']\.\.\/([^"']+)["']/g, (_, relativePath) => {
        // Remove .ts/.tsx extension if present
        const cleanPath = relativePath.replace(/\.(ts|tsx)$/, '');
        modified = true;
        return `from "@/gen/${cleanPath}"`;
      });
      
      // Fix @/gen/ paths in exports that don't include subdirectories
      fixedLine = fixedLine.replace(/from\s+"@\/gen\/([^/"']+)"/g, (match, typeName) => {
        // Skip if it already has a subdirectory
        if (typeName.includes('/')) {
          return match;
        }
        
        // Find the correct path for this type
        const correctPath = findTypeFile(typeName);
        if (correctPath) {
          modified = true;
          return `from "@/gen/${correctPath}"`;
        }
        
        return match;
      });
      
      // Fix specific export path issues
      fixedLine = fixedLine.replace(/from\s+"@\/gen\/client\/([^"]+)"/g, (match, fileName) => {
        // Check if this file actually exists in types instead of client
        const typesPath = path.join(GEN_DIR, 'types', `${fileName}.ts`);
        const clientPath = path.join(GEN_DIR, 'client', `${fileName}.ts`);
        
        if (fs.existsSync(typesPath) && !fs.existsSync(clientPath)) {
          modified = true;
          return `from "@/gen/types/${fileName}"`;
        }
        return match;
      });
      
      // Also fix any remaining .ts extensions in @/gen/ exports
      if (fixedLine.includes('@/gen/') && (fixedLine.includes('.ts"') || fixedLine.includes(".ts'"))) {
        fixedLine = fixedLine.replace(/(@\/gen\/[^"']+)\.ts(["'])/g, '$1$2');
        modified = true;
      }
    }
    
    return fixedLine;
  });
  
  if (modified) {
    const fixedContent = fixedLines.join('\n');
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔧 Fixing import paths in generated files...');
  
  if (!fs.existsSync(GEN_DIR)) {
    console.error('❌ Generated files directory not found:', GEN_DIR);
    process.exit(1);
  }
  
  const tsFiles = getAllTsFiles(GEN_DIR);
  console.log(`📁 Found ${tsFiles.length} TypeScript files`);
  
  let fixedCount = 0;
  
  for (const filePath of tsFiles) {
    const relativePath = path.relative(GEN_DIR, filePath);
    
    try {
      const wasFixed = fixImportsInFile(filePath);
      if (wasFixed) {
        console.log(`✅ Fixed: ${relativePath}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error fixing ${relativePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Import fixing completed!`);
  console.log(`📊 Files processed: ${tsFiles.length}`);
  console.log(`🔧 Files fixed: ${fixedCount}`);
  
  if (fixedCount === 0) {
    console.log('ℹ️  No files needed fixing - all imports are already correct!');
  }
}

main();