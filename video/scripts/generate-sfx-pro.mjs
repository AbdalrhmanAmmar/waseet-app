// Soft UI/transition sound set for the pro cut — synthesized here (no samples, no licensing).
// Each sound is normalised so its loudest 100 ms sits at LEVEL dBFS RMS with peaks under PEAK dBFS,
// i.e. ~20 dB under a -14 LUFS voice: felt, never on top of the speech.
// Output: public/sfx/pro/*.wav (48 kHz, 24-bit stereo). Run: node scripts/generate-sfx-pro.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000;
const TAU = Math.PI * 2;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx', 'pro');
const LEVEL = -36; // dBFS RMS of the loudest 100 ms window
const PEAK = -21; // dBFS sample peak ceiling

let seed = 7;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rnd() * 2 - 1;

class Biquad {
  constructor(type) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
  set(freq, q = 0.707, gainDb = 0) {
    const w = (TAU * Math.min(Math.max(freq, 10), SR * 0.45)) / SR;
    const cos = Math.cos(w);
    const sin = Math.sin(w);
    const alpha = sin / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (this.type === 'lp') [b0, b1, b2, a0, a1, a2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
    else if (this.type === 'hp') [b0, b1, b2, a0, a1, a2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha];
    else if (this.type === 'bp') [b0, b1, b2, a0, a1, a2] = [alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha];
    else {
      const A = 10 ** (gainDb / 40);
      [b0, b1, b2, a0, a1, a2] = [1 + alpha * A, -2 * cos, 1 - alpha * A, 1 + alpha / A, -2 * cos, 1 - alpha / A];
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

const buf = (sec) => ({ L: new Float32Array(Math.ceil(sec * SR)), R: new Float32Array(Math.ceil(sec * SR)) });
const smooth = (t) => t * t * (3 - 2 * t);
/** attack/decay envelope with smooth curves (seconds) */
const env = (t, a, d, curve = 2) => (t < a ? smooth(t / a) : Math.max(0, 1 - (t - a) / d) ** curve);

// small stereo room so sounds sit in a space instead of in your ear
const room = (b, mix = 0.18) => {
  const taps = [
    [0.013, 0.5, 0.42],
    [0.021, 0.38, 0.5],
    [0.034, 0.3, 0.26],
    [0.047, 0.22, 0.3],
    [0.071, 0.14, 0.12],
  ];
  const n = b.L.length;
  const L = Float32Array.from(b.L);
  const R = Float32Array.from(b.R);
  const lp = [new Biquad('lp').set(5500), new Biquad('lp').set(5500)];
  for (let i = 0; i < n; i++) {
    let l = 0;
    let r = 0;
    for (const [d, gl, gr] of taps) {
      const j = i - Math.round(d * SR);
      if (j >= 0) {
        l += (b.L[j] * gl + b.R[j] * (1 - gl) * 0.4) * 0.9;
        r += (b.R[j] * gr + b.L[j] * (1 - gr) * 0.4) * 0.9;
      }
    }
    L[i] += lp[0].run(l) * mix;
    R[i] += lp[1].run(r) * mix;
  }
  b.L = L;
  b.R = R;
  return b;
};

// ─── sounds ─────────────────────────────────────────────────────────────────

/** air whoosh: band-passed noise sweeping up then down, stereo drift */
const whoosh = ({ dur = 0.55, f0 = 400, f1 = 2400, q = 0.9, peakAt = 0.55, pan = 0.5 } = {}) => {
  const b = buf(dur + 0.1);
  const bp = [new Biquad('bp'), new Biquad('bp')];
  const lp = [new Biquad('lp').set(7000), new Biquad('lp').set(7000)];
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    const u = Math.min(1, t / dur);
    const sweep = u < peakAt ? smooth(u / peakAt) : 1 - smooth((u - peakAt) / (1 - peakAt)) * 0.65;
    const fc = f0 * (f1 / f0) ** sweep;
    const a = Math.sin(Math.PI * Math.min(1, u)) ** 1.6;
    const p = (u - 0.5) * pan;
    for (let c = 0; c < 2; c++) {
      bp[c].set(fc * (c ? 1.04 : 0.96), q);
      const x = lp[c].run(bp[c].run(noise())) * a * (c ? 1 + p : 1 - p);
      (c ? b.R : b.L)[i] = x;
    }
  }
  return room(b, 0.15);
};

/** swipe: short bright up-sweep, quick attack — for slides */
const swipe = ({ dur = 0.26, f0 = 900, f1 = 5200, down = false } = {}) => {
  const b = buf(dur + 0.08);
  const bp = [new Biquad('bp'), new Biquad('bp')];
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    const u = Math.min(1, t / dur);
    const s = down ? 1 - u : u;
    const fc = f0 * (f1 / f0) ** smooth(s);
    const a = env(t, dur * 0.35, dur * 0.65, 2.2);
    for (let c = 0; c < 2; c++) {
      bp[c].set(fc, 1.3);
      (c ? b.R : b.L)[i] = bp[c].run(noise()) * a * (c ? 0.5 + u * 0.5 : 1 - u * 0.5);
    }
  }
  return room(b, 0.12);
};

/** pop: soft bubble — sine with fast downward pitch glide + tiny noise transient */
const pop = ({ f0 = 820, f1 = 360, dur = 0.12 } = {}) => {
  const b = buf(dur + 0.12);
  let ph = 0;
  const lp = new Biquad('lp').set(3000);
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    const fr = f1 + (f0 - f1) * Math.exp(-t / 0.018);
    ph += (TAU * fr) / SR;
    const x = Math.sin(ph) * env(t, 0.003, dur, 3) + lp.run(noise()) * env(t, 0.001, 0.012, 2) * 0.25;
    b.L[i] = x;
    b.R[i] = x;
  }
  return room(b, 0.2);
};

/** blip: rounded upward blip (marimba-ish) — the other "appear" sound */
const blip = () => {
  const b = buf(0.32);
  let p1 = 0;
  let p2 = 0;
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    const fr = 660 + 220 * (1 - Math.exp(-t / 0.02));
    p1 += (TAU * fr) / SR;
    p2 += (TAU * fr * 3.01) / SR;
    const x = (Math.sin(p1) + 0.18 * Math.sin(p2) * Math.exp(-t / 0.03)) * env(t, 0.004, 0.22, 3);
    b.L[i] = x * 0.95;
    b.R[i] = x;
  }
  return room(b, 0.22);
};

/** click: crisp UI press — filtered transient + short body */
const click = () => {
  const b = buf(0.09);
  const hp = new Biquad('hp').set(1800);
  let ph = 0;
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    ph += (TAU * 2100) / SR;
    const x = hp.run(noise()) * env(t, 0.0005, 0.006, 2) * 0.9 + Math.sin(ph) * env(t, 0.001, 0.018, 3) * 0.5;
    b.L[i] = x;
    b.R[i] = x;
  }
  return room(b, 0.1);
};

/** tick: tiny high tick — secondary taps / values landing */
const tick = () => {
  const b = buf(0.06);
  let ph = 0;
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    ph += (TAU * 3400) / SR;
    const x = Math.sin(ph) * env(t, 0.0008, 0.014, 3);
    b.L[i] = x * 0.9;
    b.R[i] = x;
  }
  return room(b, 0.12);
};

/** riser: short 0.7 s build (noise + rising tone), ends soft — leads into a reveal */
const riser = ({ dur = 0.7 } = {}) => {
  const b = buf(dur + 0.08);
  const bp = [new Biquad('bp'), new Biquad('bp')];
  let ph = 0;
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    const u = Math.min(1, t / dur);
    const a = smooth(u) ** 1.5 * (t > dur ? Math.max(0, 1 - (t - dur) / 0.06) : 1);
    ph += (TAU * (240 + 520 * u * u)) / SR;
    for (let c = 0; c < 2; c++) {
      bp[c].set(500 + 4000 * u * u, 1.1);
      (c ? b.R : b.L)[i] = (bp[c].run(noise()) * 0.8 + Math.sin(ph + c) * 0.18) * a;
    }
  }
  return room(b, 0.18);
};

/** shimmer: airy bell partials, slightly detuned, gentle tremolo */
const shimmer = ({ base = 1320, dur = 1.1 } = {}) => {
  const b = buf(dur + 0.2);
  const parts = [1, 1.5, 2, 2.5, 3.01, 4.02];
  const phs = parts.map(() => [rnd() * TAU, rnd() * TAU]);
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    parts.forEach((p, k) => {
      const delay = k * 0.035;
      if (t < delay) return;
      const tt = t - delay;
      const a = env(tt, 0.02, dur - delay, 2.4) / (k + 1.2);
      l += Math.sin(phs[k][0] + (TAU * base * p * 0.998 * tt)) * a;
      r += Math.sin(phs[k][1] + (TAU * base * p * 1.002 * tt)) * a;
    });
    const trem = 0.85 + 0.15 * Math.sin(TAU * 7 * t);
    b.L[i] = l * trem;
    b.R[i] = r * trem;
  }
  return room(b, 0.3);
};

/** chime: two soft notes (success) */
const chime = () => {
  const b = buf(0.9);
  const notes = [
    [880, 0],
    [1318.5, 0.085],
  ];
  for (let i = 0; i < b.L.length; i++) {
    const t = i / SR;
    let x = 0;
    for (const [fr, at] of notes) {
      if (t < at) continue;
      const tt = t - at;
      x += (Math.sin(TAU * fr * tt) + 0.25 * Math.sin(TAU * fr * 2 * tt) * Math.exp(-tt / 0.08)) * env(tt, 0.004, 0.7, 3);
    }
    b.L[i] = x * 0.95;
    b.R[i] = x;
  }
  return room(b, 0.28);
};

// ─── normalise + write ──────────────────────────────────────────────────────

const normalise = (b) => {
  const win = Math.round(0.1 * SR);
  let best = 0;
  let acc = 0;
  const n = b.L.length;
  const sq = (i) => (b.L[i] ** 2 + b.R[i] ** 2) / 2;
  for (let i = 0; i < n; i++) {
    acc += sq(i);
    if (i >= win) acc -= sq(i - win);
    best = Math.max(best, acc / Math.min(win, i + 1));
  }
  const rms = Math.sqrt(best);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(b.L[i]), Math.abs(b.R[i]));
  const g = Math.min(10 ** (LEVEL / 20) / rms, 10 ** (PEAK / 20) / peak);
  // 4 ms fade-out guard
  const fade = Math.round(0.004 * SR);
  for (let i = 0; i < n; i++) {
    const k = i > n - fade ? (n - i) / fade : 1;
    b.L[i] *= g * k;
    b.R[i] *= g * k;
  }
  return b;
};

const wav = (b) => {
  const n = b.L.length;
  const out = Buffer.alloc(44 + n * 6);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + n * 6, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 6, 28);
  out.writeUInt16LE(6, 32);
  out.writeUInt16LE(24, 34);
  out.write('data', 36);
  out.writeUInt32LE(n * 6, 40);
  for (let i = 0; i < n; i++) {
    for (const [c, v] of [
      [0, b.L[i]],
      [1, b.R[i]],
    ]) {
      const s = Math.max(-1, Math.min(1, v));
      out.writeIntLE(Math.round(s * 8388607), 44 + i * 6 + c * 3, 3);
    }
  }
  return out;
};

const SOUNDS = {
  whoosh: () => whoosh(),
  'whoosh-low': () => whoosh({ dur: 0.6, f0: 220, f1: 1100, q: 0.8, peakAt: 0.45, pan: -0.5 }),
  swipe: () => swipe(),
  'swipe-down': () => swipe({ dur: 0.3, f0: 700, f1: 3800, down: true }),
  pop: () => pop(),
  blip: () => blip(),
  click: () => click(),
  tick: () => tick(),
  riser: () => riser(),
  shimmer: () => shimmer(),
  chime: () => chime(),
};

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(SOUNDS)) {
  writeFileSync(join(OUT, `${name}.wav`), wav(normalise(make())));
  console.log('sfx/pro/' + name + '.wav');
}
