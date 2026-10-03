const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) {
        processDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let originalContent = content;
      // First pass: replace specific font-sans sized instances
      content = content.replace(/font-sans\s+text-sm/g, 'font-heading font-bold uppercase tracking-widest text-xs');
      content = content.replace(/font-sans\s+text-xs/g, 'font-heading font-bold uppercase tracking-widest text-[10px]');
      content = content.replace(/font-sans\s+text-base/g, 'font-heading font-bold uppercase tracking-widest text-sm');
      content = content.replace(/font-sans\s+text-lg/g, 'font-heading font-bold uppercase tracking-widest text-base');
      
      // Cleanup redundant font weights near font-heading
      content = content.replace(/font-heading font-bold uppercase tracking-widest text-\S+\s+(?:font-medium|font-bold|font-semibold)/g, function(match) {
        return match.replace(/\s+(font-medium|font-bold|font-semibold)/, '');
      });
      content = content.replace(/(?:font-medium|font-bold|font-semibold)\s+font-heading font-bold uppercase tracking-widest/g, 'font-heading font-bold uppercase tracking-widest');
      
      // Catch remaining font-sans
      content = content.replace(/font-sans/g, 'font-heading font-bold uppercase tracking-widest');
      
      if (originalContent !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Updated: " + fullPath);
      }
    }
  }
}

processDir('d:/LeagcyXI/frontend/src/app/admin');
processDir('d:/LeagcyXI/frontend/src/components/admin');
