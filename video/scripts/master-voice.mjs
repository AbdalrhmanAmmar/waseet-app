// Voice mastering for the reel: high-pass, compressor, make-up gain and a look-ahead limiter.
// Input: public/footage/waseet-talk.mp4 → Output: public/footage/voice-master.wav (48 kHz, dual-mono)
// Run: node scripts/master-voice.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'public/footage/waseet-talk.mp4');
const raw = path.join(root, 'public/footage/voice-raw.wav');
const out = path.join(root, 'public/footage/voice-master.wav');
const SR = 48000;

execFileSync('npx', ['remotion', 'ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', raw], { cwd: root, stdio: 'inherit' });

const buf = readFileSync(raw);
const d = buf.indexOf('data') + 8;
const n = Math.floor((buf.length - d) / 2);
const x = new Float32Array(n);
for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(d + i * 2) / 32768;

// 1) high-pass 80 Hz (RBJ biquad)
{
  const w = (2 * Math.PI * 80) / SR;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * 0.707);
  const a0 = 1 + alpha;
  const [b0, b1, b2, a1, a2] = [(1 + cos) / 2 / a0, -(1 + cos) / a0, (1 + cos) / 2 / a0, (-2 * cos) / a0, (1 - alpha) / a0];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    x[i] = y;
  }
}

const db = (v) => 20 * Math.log10(Math.max(v, 1e-9));
const lin = (v) => 10 ** (v / 20);

// 2) compressor (RMS detector)
{
  const thr = -26, ratio = 3, att = Math.exp(-1 / (0.01 * SR)), rel = Math.exp(-1 / (0.15 * SR));
  let env = 0;
  for (let i = 0; i < n; i++) {
    const p = x[i] * x[i];
    env = p > env ? att * env + (1 - att) * p : rel * env + (1 - rel) * p;
    const level = 10 * Math.log10(env + 1e-12);
    const gr = level > thr ? (level - thr) * (1 - 1 / ratio) : 0;
    x[i] *= lin(-gr);
  }
}

// 2b) gentle downward expander to tame room tone between phrases
{
  const thr = -50, ratio = 2, att = Math.exp(-1 / (0.005 * SR)), rel = Math.exp(-1 / (0.12 * SR));
  let env = 0, g = 1;
  const gs = Math.exp(-1 / (0.03 * SR));
  for (let i = 0; i < n; i++) {
    const p = x[i] * x[i];
    env = p > env ? att * env + (1 - att) * p : rel * env + (1 - rel) * p;
    const level = 10 * Math.log10(env + 1e-12);
    const target = level < thr ? lin(Math.max(-10, (level - thr) * (ratio - 1))) : 1;
    g = gs * g + (1 - gs) * target;
    x[i] *= g;
  }
}

// 3) make-up gain to a speech RMS target (measured on voiced 50 ms windows only)
{
  const win = SR * 0.05;
  const levels = [];
  for (let s = 0; s + win < n; s += win) {
    let ss = 0;
    for (let i = s; i < s + win; i++) ss += x[i] * x[i];
    levels.push(10 * Math.log10(ss / win + 1e-12));
  }
  const voiced = levels.filter((l) => l > -45).sort((a, b) => a - b);
  const median = voiced[Math.floor(voiced.length / 2)];
  const gain = lin(-17 - median);
  for (let i = 0; i < n; i++) x[i] *= gain;
  console.log(`speech median ${median.toFixed(1)} dBFS → gain ${db(gain).toFixed(1)} dB`);
}

// 4) look-ahead limiter at -1 dBFS
{
  const ceil = lin(-1), look = Math.round(0.005 * SR), rel = Math.exp(-1 / (0.08 * SR));
  const y = new Float32Array(n);
  let g = 1;
  for (let i = 0; i < n; i++) {
    let peak = 0;
    for (let k = i; k < Math.min(n, i + look); k++) peak = Math.max(peak, Math.abs(x[k]));
    const target = peak > ceil ? ceil / peak : 1;
    g = target < g ? target : rel * g + (1 - rel) * target;
    y[i] = x[i] * g;
  }
  x.set(y);
}

const data = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {
  const v = Math.round(Math.max(-1, Math.min(1, x[i])) * 32767);
  data.writeInt16LE(v, i * 4);
  data.writeInt16LE(v, i * 4 + 2);
}
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28);
h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
writeFileSync(out, Buffer.concat([h, data]));
console.log('→', out);
