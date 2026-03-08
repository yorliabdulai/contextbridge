const fs = require('fs');
const path = require('path');

// Copy manifest
fs.copyFileSync(
  path.join(__dirname, '../src/manifest.json'),
  path.join(__dirname, '../dist/manifest.json')
);

// Copy popup HTML and CSS
fs.mkdirSync(path.join(__dirname, '../dist/popup'), { recursive: true });
fs.copyFileSync(
  path.join(__dirname, '../src/popup/index.html'),
  path.join(__dirname, '../dist/popup/index.html')
);
fs.copyFileSync(
  path.join(__dirname, '../src/popup/popup.css'),
  path.join(__dirname, '../dist/popup/popup.css')
);

console.log('Assets copied successfully');