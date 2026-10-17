// Prepares the pro cut's footage (public/footage is outside git): copies the source edit and cuts the
// product photos and the end-card hold frame out of it. Needs a full ffmpeg (`brew install ffmpeg`).
// Run: node scripts/prepare-pro.mjs [/path/to/waseet.mp4]
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.resolve(process.argv[2] ?? path.join(root, '../../waseet.mp4'));
const footage = path.join(root, 'public/footage');
const pro = path.join(footage, 'pro');
const video = path.join(footage, 'waseet-pro.mp4');
mkdirSync(pro, { recursive: true });
copyFileSync(src, video);

const ff = (...args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const tablet = 'crop=iw*0.86:ih*0.72:iw*0.07:ih*0.135'; // the dashboard recording's screen area
const tmp = (n) => path.join(pro, `.${n}.jpg`);

// product photos from the dashboard recording (preview at 15.4 s, gallery at 13 s, library at 16.95 s)
ff('-ss', '15.4', '-i', video, '-frames:v', '1', '-vf', 'crop=1627:455:279:1480', '-q:v', '2', tmp('wide'));
ff('-ss', '13.0', '-i', video, '-frames:v', '1', '-vf', `${tablet},crop=730:225:990:430`, '-q:v', '2', tmp('beige'));
ff('-ss', '16.95', '-i', video, '-frames:v', '1', '-vf', `${tablet},crop=780:405:1085:2048`, '-q:v', '2', tmp('card'));
ff('-i', tmp('wide'), '-vf', 'crop=640:445:290:5', '-q:v', '2', path.join(pro, 'bag-1.jpg'));
ff('-i', tmp('beige'), '-vf', 'crop=600:225:40:0', '-q:v', '2', path.join(pro, 'bag-2.jpg'));
ff('-i', tmp('card'), '-vf', 'crop=460:330:20:60', '-q:v', '2', path.join(pro, 'bag-3.jpg'));
for (const n of ['wide', 'beige', 'card']) rmSync(tmp(n));

// last frame, held under the WhatsApp card
ff('-sseof', '-0.04', '-i', video, '-frames:v', '1', '-update', '1', path.join(pro, 'last-frame.png'));
console.log('ready:', path.relative(root, video), '+ footage/pro/*');
