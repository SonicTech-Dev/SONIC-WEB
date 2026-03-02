/**
 * Copies GSAP distributable to /public so it can be served statically without bundling.
 * This keeps the setup minimal and works with the existing Express static hosting.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'gsap', 'dist', 'gsap.min.js');
const destDir = path.join(__dirname, '..', 'public', 'vendor', 'gsap');
const dest = path.join(destDir, 'gsap.min.js');

fs.mkdirSync(destDir, { recursive: true });

if (!fs.existsSync(src)) {
  console.error('GSAP source not found:', src);
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log('Copied GSAP to', dest);
