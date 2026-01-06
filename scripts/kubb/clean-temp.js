#!/usr/bin/env node

/**
 * Script to clean up temporary files after Kubb generation
 */

const fs = require('fs');
const path = require('path');

const TEMP_FILES = [
  'temp-openapi.json'
];

function cleanTempFiles() {
  let cleaned = 0;
  
  TEMP_FILES.forEach(file => {
    const filePath = path.join(__dirname, '../..', file);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Cleaned: ${file}`);
        cleaned++;
      } catch (error) {
        console.warn(`⚠ Failed to clean ${file}: ${error.message}`);
      }
    }
  });
  
  if (cleaned === 0) {
    console.log('No temporary files to clean');
  } else {
    console.log(`✓ Cleaned ${cleaned} temporary file(s)`);
  }
}

cleanTempFiles();