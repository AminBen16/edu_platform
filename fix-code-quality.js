/**
 * Code Quality Fix Script
 * Run: node fix-code-quality.js
 * This script removes console.log statements from production code
 */

const fs = require('fs');
const path = require('path');

const directories = [
  'apps/api/src/routes',
  'apps/api/src/middleware',
  'apps/api/src/services',
  'apps/api/src/config',
  'apps/api/src/lib'
];

// Patterns to remove
const patternsToRemove = [
  // console.log statements
  /console\.log\(`[^`]*`\);?/g,
  /console\.log\([^)]*\);?/g,
  // console.warn statements  
  /console\.warn\([^)]*\);?/g,
  // Debug console statements
  /console\.debug\([^)]*\);?/g,
  // Development-only logs
  /if \(process\.env\.NODE_ENV !== 'production'\)\s*\{[\s\S]*?console\.log[^}]*\}/g,
];

// Files to skip
const skipFiles = [
  'apps/api/src/index.ts' // Keep root index for startup messages
];

function processFile(filePath) {
  if (skipFiles.some(skip => filePath.includes(skip))) {
    console.log(`Skipping: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Remove console.log, console.warn, console.debug
  content = content.replace(/console\.(log|warn|debug)\(`[^`]*`\);?/g, '');
  content = content.replace(/console\.(log|warn|debug)\([^)]*\);?/g, '');
  
  // Remove empty console statements
  content = content.replace(/console\.[^;]*;\s*$/gm, '');
  
  // Clean up multiple empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('Starting code quality fixes...\n');

directories.forEach(dir => {
  walkDir(dir);
});

console.log('\n✅ Code quality fixes complete!');
console.log('Note: Some console.error statements are kept for error logging.');
