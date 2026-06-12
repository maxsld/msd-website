const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all HTML files except node_modules
const htmlFiles = execSync('find . -name "*.html" -type f | grep -v node_modules', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(file => file);

console.log(`Found ${htmlFiles.length} HTML files to process`);

const analyticsSnippet = `
  <!-- Vercel Web Analytics -->
  <script src="/assets/js/analytics.bundle.js" defer></script>`;

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

htmlFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check if analytics is already added
    if (content.includes('analytics.bundle.js')) {
      skippedCount++;
      return;
    }
    
    // Check if file has </head> tag
    if (!content.includes('</head>')) {
      console.log(`Skipping ${file}: No </head> tag found`);
      skippedCount++;
      return;
    }
    
    // Add analytics before </head>
    const updatedContent = content.replace('</head>', `${analyticsSnippet}\n</head>`);
    
    fs.writeFileSync(file, updatedContent, 'utf-8');
    updatedCount++;
    
    if (updatedCount % 10 === 0) {
      console.log(`Progress: ${updatedCount} files updated...`);
    }
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\nComplete!`);
console.log(`✓ Updated: ${updatedCount} files`);
console.log(`- Skipped: ${skippedCount} files (already had analytics or no </head> tag)`);
console.log(`✗ Errors: ${errorCount} files`);
