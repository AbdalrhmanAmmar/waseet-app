import { mkdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('assets/branding/logo.svg', root), 'utf8');
const mark = source.replace(/<svg[^>]*>/, '').replace('</svg>', '')
  .replace(/<rect\b[^>]*\/>/, '').trim();
// Match the app icon, with a full square background; the store applies its mask.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#F8FAF7"/>
  <g transform="translate(32 32) scale(.9) translate(-32 -31)">${mark}</g>
</svg>`;
const output = new URL('assets/store/google-play-icon.png', root);
await mkdir(new URL('assets/store/', root), { recursive: true });
await sharp(Buffer.from(svg)).resize(512, 512).ensureAlpha()
  .png({ compressionLevel: 9, palette: false }).toFile(fileURLToPath(output));
const metadata = await sharp(fileURLToPath(output)).metadata();
const { size } = await stat(output);
if (metadata.width !== 512 || metadata.height !== 512 || size > 1_000_000) {
  throw new Error('Generated icon does not meet the requested dimensions or size.');
}
console.log(`assets/store/google-play-icon.png: 512 × 512, RGBA PNG, ${size} bytes`);
