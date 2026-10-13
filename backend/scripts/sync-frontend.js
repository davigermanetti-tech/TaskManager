import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd(), '..');
const publicDir = path.resolve(process.cwd(), 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const files = ['index.html', 'style.css', 'script.js', 'api.js'];
let copied = 0;

for (const file of files) {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    copied++;
  }
}

console.log(`[sync-frontend] Copied ${copied} frontend files into backend/public/`);
