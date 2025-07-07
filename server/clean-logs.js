const fs = require('fs');
const path = require('path');

// Function to remove console logs from file content
function removeConsoleLogs(content) {
  // Remove various console statement patterns
  const patterns = [
    // Simple console.log statements
    /console\.log\([^)]*\);?\n?/g,
    // Console.error, warn, info, etc.
    /console\.(error|warn|info|debug|trace)\([^)]*\);?\n?/g,
    // Multi-line console statements
    /console\.(log|error|warn|info|debug|trace)\([^;]*?;/g,
    // Console statements with template literals
    /console\.(log|error|warn|info|debug|trace)\(`[^`]*`[^;]*\);?\n?/g,
  ];
  
  let cleaned = content;
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Clean up extra empty lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return cleaned;
}

// Function to process files recursively
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (file.endsWith('.js') && file !== 'clean-logs.js') {
      console.log(`Processing: ${filePath}`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const cleaned = removeConsoleLogs(content);
        
        if (content !== cleaned) {
          fs.writeFileSync(filePath, cleaned, 'utf8');
          console.log(`  ✅ Cleaned console logs from ${filePath}`);
        } else {
          console.log(`  ℹ️  No console logs found in ${filePath}`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error.message);
      }
    }
  });
}

// Start processing from current directory
console.log('🧹 Starting console log cleanup...');
processDirectory(__dirname);
console.log('✅ Console log cleanup completed!');
