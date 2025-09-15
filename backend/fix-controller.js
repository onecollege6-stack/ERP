const fs = require('fs');
const path = require('path');

// Path to the controller file
const filePath = path.resolve(__dirname, 'controllers', 'classSubjectsController.js');

// Read the file
console.log(`Reading file: ${filePath}`);
const content = fs.readFileSync(filePath, 'utf8');

// Find and fix the syntax errors
let fixedContent = content;

// Remove the duplicate error handler
fixedContent = fixedContent.replace(
  /};\s+\s+}\s+catch\s+\(error\)\s+{\s+console\.error\('Error getting classes with subjects:', error\);\s+res\.status\(500\)\.json\({\s+success:\s+false,\s+message:\s+'Internal server error while retrieving classes'\s+}\);\s+}\s+};/g,
  '};'
);

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log('File fixed successfully!');
