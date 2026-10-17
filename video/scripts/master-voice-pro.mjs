// Voice mastering for the pro cut (needs a full ffmpeg, e.g. `brew install ffmpeg`):
// rumble high-pass → FFT denoise with noise tracking → light EQ → gentle de-ess → leveling
// compressor → two-pass EBU R128 loudnorm to -14 LUFS / -1.5 dBTP → safety limiter.
// Input: public/footage/waseet-pro.mp4 → Output: public/footage/voice-pro.wav (48 kHz stereo)
// Run: node scripts/master-voice-pro.mjs
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'public/footage/waseet-pro.mp4');
const out = path.join(root, 'public/footage/voice-pro.wav');

const CLEAN = [
  'pan=mono|c0=0.5*c0+0.5*c1',
  'highpass=f=75:poles=2',
  'afftdn=nr=10:nf=-52:tn=1',
  'equalizer=f=220:t=q:w=1.1:g=-1.5', // a touch less boxiness
  'equalizer=f=3200:t=q:w=1.4:g=1.5', // presence
  'deesser=i=0.25:m=0.5:f=0.5',
  'acompressor=threshold=-26dB:ratio=2.6:attack=6:release=140:knee=6:makeup=3',
  'pan=stereo|c0=c0|c1=c0', // measure as delivered (dual-mono reads +3 LU over mono)
].join(',');
const TARGET = 'I=-14:TP=-1.5:LRA=7';

const ffmpeg = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};

// pass 1: measure
const log = ffmpeg(['-i', src, '-vn', '-af', `${CLEAN},loudnorm=${TARGET}:print_format=json`, '-f', 'null', '-']);
const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));

// pass 2: apply with the measured values (linear mode keeps the delivery natural)
const ln = `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
ffmpeg(['-y', '-i', src, '-vn', '-af', `${CLEAN},${ln},alimiter=limit=0.84:attack=3:release=60:level=false`, '-ar', '48000', '-c:a', 'pcm_s24le', out]);
console.log(`in ${m.input_i} LUFS → ${out}`);
