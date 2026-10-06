import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

// Build-time dependency only; the generated HTML makes no CDN requests.
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const cli = process.argv[2];
if (!cli) throw new Error('Pass the installed @tailwindcss/cli/dist/index.mjs path. See README.ar.md.');
const temp = await mkdtemp(join(tmpdir(), 'waseet-privacy-css-'));
try {
  const cssFile = join(temp, 'compiled.css');
  const inputFile = join(temp, 'input.css');
  const requireFromCli = createRequire(resolve(cli));
  const input = (await readFile(join(here, 'style.css'), 'utf8'))
    .replace('"tailwindcss"', JSON.stringify(requireFromCli.resolve('tailwindcss/index.css')))
    .replace('"./source.html"', JSON.stringify(join(here, 'source.html')));
  await writeFile(inputFile, input);
  execFileSync(process.execPath, [resolve(cli), '-i', inputFile, '-o', cssFile, '--minify'], { stdio: 'inherit' });
  const fonts = await Promise.all(['Regular', 'Bold'].map(async (name) => {
    const data = await readFile(join(root, `assets/fonts/tajawal/Tajawal-${name}.ttf`));
    return `@font-face{font-family:Tajawal;font-weight:${name === 'Bold' ? 700 : 400};font-style:normal;font-display:swap;src:url(data:font/ttf;base64,${data.toString('base64')}) format('truetype')}`;
  }));
  const [template, css, script, logo, license] = await Promise.all([
    readFile(join(here, 'source.html'), 'utf8'), readFile(cssFile, 'utf8'),
    readFile(join(here, 'enhance.js'), 'utf8'),
    readFile(join(root, 'assets/branding/logo.svg'), 'utf8'),
    readFile(join(root, 'assets/fonts/tajawal/OFL.txt'), 'utf8'),
  ]);
  const html = template.replace('/* INLINE_STYLES */', () => `${fonts.join('\n')}\n${css}`)
    .replace('<!-- BRAND_LOGO -->', () => logo)
    .replace('/* INLINE_SCRIPT */', () => script)
    .replace('</head>', () => `<!-- Embedded Tajawal font license:\n${license.replaceAll('--', '—')}\n-->\n</head>`);
  await writeFile(join(here, 'privacy-policy.html'), html);
  console.log(`Created docs/privacy-policy/privacy-policy.html (${Buffer.byteLength(html)} bytes)`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
