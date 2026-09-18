import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('assets/branding/logo.svg', root), 'utf8');
const background = '#F8FAF7';
// Keep the dashboard SVG untouched; omit its rounded tile only in derived assets.
const mark = source
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '')
  .replace(/<rect\b[^>]*\/>/, '')
  .trim();
const svg = (size, content) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${content}</svg>`,
  );
const centeredMark = `<g transform="translate(0 1)">${mark}</g>`;
const icon = svg(
  64,
  `<rect width="64" height="64" fill="${background}"/><g transform="translate(32 32) scale(.9) translate(-32 -31)">${mark}</g>`,
);
// Original mark bounds are 50×50, centered at (32,31). On a 108×108 layer
// this stays within Android's central 66dp safe zone, including circular masks.
const adaptive = svg(108, `<g transform="translate(22 23)">${mark}</g>`);
// Preserve the cube's white dividing lines as transparent cutouts for themed icons.
const monoMark = mark.replaceAll('#147D64', '#fff').replaceAll('#F29A4A', '#fff');
const dividingLine = /<path\b[^>]*stroke="#fff"[^>]*\/>/.exec(mark)?.[0];
if (!dividingLine) throw new Error('The logo cube separator could not be found.');
const mono = svg(
  108,
  `<defs><mask id="shape"><rect width="108" height="108" fill="black"/><g transform="translate(22 23)">${monoMark.replace(dividingLine, dividingLine.replace('stroke="#fff"', 'stroke="#000"'))}</g></mask></defs><rect width="108" height="108" fill="white" mask="url(#shape)"/>`,
);

const outputs = [
  ['app-icon.png', icon, 1024, true],
  ['android-icon-foreground.png', adaptive, 1024],
  ['android-icon-monochrome.png', mono, 1024],
  ['splash-icon.png', svg(64, centeredMark), 1024],
  ['brand-logo.png', svg(64, centeredMark), 512],
  ['favicon.png', Buffer.from(source), 64],
];
await mkdir(new URL('assets/images/', root), { recursive: true });
for (const [name, input, size, opaque] of outputs) {
  let pipeline = sharp(input, { density: 1152 }).resize(size, size);
  if (opaque) pipeline = pipeline.flatten({ background }).removeAlpha();
  await pipeline
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(`assets/images/${name}`, root)));
  console.log(`${name}: ${size}×${size}${opaque ? ' RGB (opaque)' : ' RGBA'}`);
}
