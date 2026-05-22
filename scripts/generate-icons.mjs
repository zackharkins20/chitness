// Generates PWA + iOS icons from public/icon-source.jpg.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "scripts/icon-source.jpg";
const OUT_DIR = "public";

await mkdir(OUT_DIR, { recursive: true });

// All variants: { filename, size }
const variants = [
  { file: "apple-icon.png", size: 180 },  // iOS apple-touch-icon
  { file: "icon-192.png",   size: 192 },  // PWA manifest
  { file: "icon-512.png",   size: 512 },  // PWA manifest hi-res
  { file: "icon.png",       size: 512 },  // Next.js icon convention (replaces icon.svg)
];

for (const { file, size } of variants) {
  await sharp(SRC)
    // Square center-crop, then resize.
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ quality: 92 })
    .toFile(`${OUT_DIR}/${file}`);
  console.log(`✓ ${file} (${size}×${size})`);
}
