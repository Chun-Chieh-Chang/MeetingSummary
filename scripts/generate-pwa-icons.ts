import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

// Create icons directory if not exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 192x192 icon
sharp(path.join(publicDir, 'favicon.svg'))
  .resize(192, 192)
  .png()
  .toFile(path.join(iconsDir, 'icons-192.png'));

// Generate 512x512 icon
sharp(path.join(publicDir, 'favicon.svg'))
  .resize(512, 512)
  .png()
  .toFile(path.join(iconsDir, 'icons-512.png'));

console.log('PWA icons generated successfully!');
