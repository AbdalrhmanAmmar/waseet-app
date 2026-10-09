// Procedural sound design for the Waseet film.
// Every sound is synthesized here (no samples, no licensing) and written to public/sfx.
// Run: npm run sfx
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx');
const TAU = Math.PI * 2;

// ---------- primitives ----------

const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const stereo = (seconds) => {
  const n = Math.ceil(seconds * SR);
  return { L: new Float32Array(n), R: new Float32Array(n), n };
};

const midi = (m) => 440 * 2 ** ((m - 69) / 12);

const panGains = (pan) => {
  const a = ((pan + 1) / 4) * Math.PI;
  return [Math.cos(a), Math.sin(a)];
};

// RBJ biquad with per-sample parameter updates.
class Biquad {
  constructor(type) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
  set(freq, q) {
    const w = (TAU * Math.min(freq, SR * 0.45)) / SR;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (this.type === 'lp') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
    else if (this.type === 'hp') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha];
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
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

// Freeverb-style stereo reverb.
const reverb = (buf, { wet = 0.3, room = 0.84, damp = 0.3, tail = 0 } = {}) => {
  const scale = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const alls = [556, 441, 341, 225];
  const make = (spread) => ({
    combs: combs.map((d) => ({ b: new Float32Array(Math.round((d + spread) * scale)), i: 0, f: 0 })),
    alls: alls.map((d) => ({ b: new Float32Array(Math.round((d + spread) * scale)), i: 0 })),
  });
  const ch = [make(0), make(23)];
  const n = buf.n + Math.ceil(tail * SR);
  const out = stereo(n / SR);
  for (let s = 0; s < n; s++) {
    const input = ((buf.L[s] ?? 0) + (buf.R[s] ?? 0)) * 0.015;
    for (let c = 0; c < 2; c++) {
      let acc = 0;
      for (const cb of ch[c].combs) {
        const y = cb.b[cb.i];
        cb.f = y * (1 - damp) + cb.f * damp;
        cb.b[cb.i] = input + cb.f * room;
        cb.i = (cb.i + 1) % cb.b.length;
        acc += y;
      }
      for (const ap of ch[c].alls) {
        const y = ap.b[ap.i];
        ap.b[ap.i] = acc + y * 0.5;
        ap.i = (ap.i + 1) % ap.b.length;
        acc = y - acc;
      }
      const dry = c === 0 ? (buf.L[s] ?? 0) : (buf.R[s] ?? 0);
      (c === 0 ? out.L : out.R)[s] = dry * (1 - wet * 0.5) + acc * wet;
    }
  }
  return out;
};

const pingPong = (buf, { time = 0.375, feedback = 0.35, mix = 0.3 } = {}) => {
  const d = Math.round(time * SR);
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  let i = 0;
  for (let s = 0; s < buf.n; s++) {
    const yl = bl[i];
    const yr = br[i];
    bl[i] = buf.L[s] + yr * feedback;
    br[i] = yl * feedback;
    i = (i + 1) % d;
    buf.L[s] += yl * mix;
    buf.R[s] += yr * mix;
  }
  return buf;
};

const mixInto = (dst, src, at = 0, gain = 1) => {
  const o = Math.round(at * SR);
  for (let s = 0; s < src.n && s + o < dst.n; s++) {
    dst.L[s + o] += src.L[s] * gain;
    dst.R[s + o] += src.R[s] * gain;
  }
  return dst;
};

const finish = (buf, peak = 0.89, fadeOut = 0.02) => {
  let max = 0;
  for (let s = 0; s < buf.n; s++) {
    buf.L[s] = Math.tanh(buf.L[s] * 1.1);
    buf.R[s] = Math.tanh(buf.R[s] * 1.1);
    max = Math.max(max, Math.abs(buf.L[s]), Math.abs(buf.R[s]));
  }
  const g = max > 0 ? peak / max : 1;
  const fo = Math.round(fadeOut * SR);
  for (let s = 0; s < buf.n; s++) {
    const f = s > buf.n - fo ? (buf.n - s) / fo : 1;
    buf.L[s] *= g * f;
    buf.R[s] *= g * f;
  }
  return buf;
};

const writeWav = (name, buf) => {
  const data = Buffer.alloc(buf.n * 4);
  for (let s = 0; s < buf.n; s++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf.L[s])) * 32767), s * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf.R[s])) * 32767), s * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(join(OUT, `${name}.wav`), Buffer.concat([h, data]));
  console.log(`  ${name}.wav  ${(buf.n / SR).toFixed(2)}s`);
};

// ---------- instruments ----------

// Glassy bell: slightly inharmonic partials with independent decays.
const bell = (buf, { at, freq, amp = 0.3, decay = 1.4, pan = 0, partials = [[1, 1], [2.0, 0.42], [3.01, 0.2], [4.17, 0.12], [5.43, 0.06]] }) => {
  const [gl, gr] = panGains(pan);
  const start = Math.round(at * SR);
  const len = Math.min(buf.n - start, Math.round(decay * 4 * SR));
  for (let s = 0; s < len; s++) {
    const t = s / SR;
    const atk = Math.min(1, t / 0.003);
    let v = 0;
    for (const [r, a] of partials) v += Math.sin(TAU * freq * r * t) * a * Math.exp((-t * r ** 0.7) / decay);
    v *= amp * atk;
    buf.L[start + s] += v * gl;
    buf.R[start + s] += v * gr;
  }
};

// Warm pad voice: band-limited additive saw, detuned, with a moving "filter" (harmonic tilt).
const padNote = (buf, { start, end, note, amp, attack = 1.2, release = 1.6, bright = () => 4, pan = 0 }) => {
  const s0 = Math.round(start * SR);
  const s1 = Math.min(buf.n, Math.round((end + release) * SR));
  const f = midi(note);
  const detune = [-0.07, 0, 0.07].map((c) => f * 2 ** (c / 12));
  const phase = detune.map((_, i) => i * 1.7);
  const [gl, gr] = panGains(pan);
  for (let s = s0; s < s1; s++) {
    const t = (s - s0) / SR;
    const abs = s / SR;
    const env = Math.min(1, t / attack) * (abs > end ? Math.max(0, 1 - (abs - end) / release) : 1);
    if (env <= 0) continue;
    const k = bright(abs);
    let v = 0;
    for (let d = 0; d < 3; d++) {
      const ph = TAU * detune[d] * t + phase[d];
      for (let h = 1; h <= 9; h++) {
        if (detune[d] * h > 9000) break;
        v += (Math.sin(ph * h) / h) * Math.exp(-h / k);
      }
    }
    v *= amp * env * env * 0.22;
    const wob = 1 + 0.15 * Math.sin(TAU * 0.13 * abs + note);
    buf.L[s] += v * gl * wob;
    buf.R[s] += v * gr * (2 - wob);
  }
};

const sine = (buf, { at, dur, freq, amp, decay = 1, pan = 0, attack = 0.005 }) => {
  const [gl, gr] = panGains(pan);
  const s0 = Math.round(at * SR);
  let ph = 0;
  for (let s = 0; s < Math.round(dur * SR) && s0 + s < buf.n; s++) {
    const t = s / SR;
    const fr = typeof freq === 'function' ? freq(t) : freq;
    ph += (TAU * fr) / SR;
    const v = Math.sin(ph) * amp * Math.min(1, t / attack) * Math.exp(-t / decay);
    buf.L[s0 + s] += v * gl;
    buf.R[s0 + s] += v * gr;
  }
};

const noiseBurst = (buf, { at, dur, amp, env, filter, pan = () => 0, seed = 1 }) => {
  const rnd = mulberry32(seed);
  const s0 = Math.round(at * SR);
  const n = Math.round(dur * SR);
  const fl = filter ? new Biquad(filter.type) : null;
  const fr = filter ? new Biquad(filter.type) : null;
  for (let s = 0; s < n && s0 + s < buf.n; s++) {
    const t = s / SR;
    const p = t / dur;
    if (fl && s % 16 === 0) {
      const [freq, q] = filter.at(p);
      fl.set(freq, q);
      fr.set(freq, q);
    }
    const a = amp * env(p);
    let l = rnd() * 2 - 1;
    let r = rnd() * 2 - 1;
    if (fl) {
      l = fl.run(l);
      r = fr.run(r);
    }
    const [gl, gr] = panGains(pan(p));
    buf.L[s0 + s] += l * a * gl;
    buf.R[s0 + s] += r * a * gr;
  }
};

const shimmerGrains = (buf, { at, dur, count, seed, amp = 0.08, notes = [86, 88, 90, 93, 95, 98, 100, 102, 105] }) => {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const p = rnd() ** 1.6;
    bell(buf, {
      at: at + p * dur,
      freq: midi(notes[Math.floor(rnd() * notes.length)]) * (1 + (rnd() - 0.5) * 0.004),
      amp: amp * (1 - p * 0.6) * (0.5 + rnd() * 0.5),
      decay: 0.12 + rnd() * 0.3,
      pan: rnd() * 1.6 - 0.8,
      partials: [[1, 1], [2.0, 0.3], [3.0, 0.1]],
    });
  }
};

// ---------- sounds ----------

const whoosh = (seed, dur = 1.0, up = true) => {
  const b = stereo(dur + 0.6);
  noiseBurst(b, {
    at: 0,
    dur,
    amp: 1.1,
    seed,
    env: (p) => Math.sin(Math.PI * Math.min(1, p ** (up ? 0.8 : 1.2))) ** 2,
    filter: { type: 'bp', at: (p) => [300 * 9 ** Math.sin(Math.PI * p * 0.9), 1.1] },
    pan: (p) => (up ? -0.7 + p * 1.4 : 0.7 - p * 1.4),
  });
  noiseBurst(b, {
    at: 0,
    dur,
    amp: 0.5,
    seed: seed + 9,
    env: (p) => Math.sin(Math.PI * p) ** 3,
    filter: { type: 'lp', at: (p) => [200 + 500 * Math.sin(Math.PI * p), 0.7] },
  });
  return finish(reverb(b, { wet: 0.25, room: 0.7 }), 0.8);
};

const impact = (seed, big = false) => {
  const b = stereo(big ? 3.4 : 2.6);
  sine(b, { at: 0, dur: 2.5, freq: (t) => 38 + 52 * Math.exp(-t * 7), amp: 1, decay: big ? 0.9 : 0.6, attack: 0.002 });
  sine(b, { at: 0, dur: 0.4, freq: (t) => 60 + 140 * Math.exp(-t * 30), amp: 0.7, decay: 0.09, attack: 0.001 });
  noiseBurst(b, { at: 0, dur: 0.05, amp: 0.6, seed, env: (p) => 1 - p, filter: { type: 'hp', at: () => [2500, 0.7] } });
  noiseBurst(b, {
    at: 0,
    dur: big ? 2.2 : 1.4,
    amp: 0.35,
    seed: seed + 3,
    env: (p) => Math.exp(-p * 5),
    filter: { type: 'lp', at: (p) => [3000 * Math.exp(-p * 3) + 150, 0.7] },
  });
  return finish(reverb(b, { wet: big ? 0.45 : 0.35, room: big ? 0.9 : 0.82, damp: 0.4 }));
};

const riser = (dur) => {
  const b = stereo(dur);
  noiseBurst(b, {
    at: 0,
    dur,
    amp: 0.9,
    seed: 77,
    env: (p) => p ** 2.4,
    filter: { type: 'bp', at: (p) => [250 * 28 ** p, 1.6] },
    pan: (p) => Math.sin(p * 18) * 0.4 * p,
  });
  for (const [m, a] of [[45, 0.22], [52, 0.16], [57, 0.14]])
    sine(b, {
      at: 0,
      dur,
      freq: (t) => midi(m) * 2 ** ((t / dur) * 1.5) * (1 + 0.01 * Math.sin(TAU * 6 * t)),
      amp: a,
      decay: 99,
      attack: dur * 0.9,
    });
  shimmerGrains(b, { at: dur * 0.45, dur: dur * 0.55, count: 40, seed: 5, amp: 0.05 });
  return finish(reverb(b, { wet: 0.3 }), 0.85, 0.01);
};

const shimmer = (seed, dur = 1.6, count = 45) => {
  const b = stereo(dur + 0.4);
  shimmerGrains(b, { at: 0, dur, count, seed });
  return finish(reverb(b, { wet: 0.55, room: 0.88, tail: 1.2 }), 0.7);
};

const chime = (note) => {
  const b = stereo(1.2);
  bell(b, { at: 0, freq: midi(note), amp: 0.5, decay: 0.9 });
  bell(b, { at: 0.004, freq: midi(note + 12), amp: 0.12, decay: 0.4, pan: 0.3 });
  return finish(reverb(b, { wet: 0.45, room: 0.85, tail: 1.6 }), 0.7);
};

const pop = () => {
  const b = stereo(0.35);
  sine(b, { at: 0, dur: 0.25, freq: (t) => 340 + 700 * Math.exp(-t * 55), amp: 0.9, decay: 0.05, attack: 0.001 });
  noiseBurst(b, { at: 0, dur: 0.015, amp: 0.15, seed: 4, env: (p) => 1 - p, filter: { type: 'hp', at: () => [4000, 0.7] } });
  return finish(reverb(b, { wet: 0.2, room: 0.6, tail: 0.3 }), 0.7);
};

const coin = () => {
  const b = stereo(0.9);
  bell(b, { at: 0, freq: midi(95), amp: 0.35, decay: 0.12 });
  bell(b, { at: 0.075, freq: midi(100), amp: 0.45, decay: 0.45 });
  return finish(reverb(b, { wet: 0.35, tail: 1 }), 0.65);
};

const swell = (dur = 1.4) => {
  const b = stereo(dur);
  noiseBurst(b, {
    at: 0,
    dur,
    amp: 0.8,
    seed: 31,
    env: (p) => p ** 3,
    filter: { type: 'hp', at: (p) => [1200 + 3000 * p, 0.7] },
  });
  for (const m of [74, 78, 81]) sine(b, { at: 0, dur, freq: midi(m), amp: 0.06, decay: 99, attack: dur * 0.95 });
  return finish(b, 0.7, 0.008);
};

const logoHit = () => {
  const b = stereo(4.2);
  mixInto(b, impact(101, true), 0, 0.9);
  // bright D-major stab + sparkle tail
  for (const [m, a, p] of [[62, 0.22, -0.3], [66, 0.18, 0.3], [69, 0.2, -0.1], [74, 0.2, 0.2], [81, 0.12, 0]]) {
    bell(b, { at: 0, freq: midi(m), amp: a, decay: 1.6, pan: p });
    padNote(b, { start: 0, end: 0.6, note: m, amp: a * 0.9, attack: 0.01, release: 2.4, bright: () => 6, pan: p });
  }
  shimmerGrains(b, { at: 0.05, dur: 2.6, count: 70, seed: 202, amp: 0.06 });
  return finish(reverb(b, { wet: 0.4, room: 0.9 }), 0.92);
};

// 20s music bed in D major. Chord changes follow the four scenes; the final chord lands on the logo hit.
const music = () => {
  const DUR = 20;
  const b = stereo(DUR);
  const HIT = 502 / 30;
  const chords = [
    { start: 0, end: 5, bass: 38, notes: [62, 66, 69, 73, 76] }, // Dmaj9
    { start: 5, end: 10, bass: 35, notes: [59, 62, 66, 69, 73] }, // Bm9
    { start: 10, end: 13.4, bass: 31, notes: [55, 59, 62, 66, 69] }, // Gmaj9
    { start: 13.4, end: HIT, bass: 33, notes: [57, 62, 64, 69, 71] }, // Asus
    { start: HIT, end: DUR, bass: 38, notes: [50, 57, 64, 66, 73, 74] }, // Dmaj9 (open)
  ];
  const bright = (t) => (t < HIT ? 2 + 4 * (t / HIT) ** 1.5 : 7 - 3 * Math.min(1, (t - HIT) / 3));
  chords.forEach((c, ci) => {
    const last = ci === chords.length - 1;
    c.notes.forEach((n, i) =>
      padNote(b, {
        start: c.start,
        end: c.end,
        note: n,
        amp: (last ? 0.34 : 0.28) * (1 - i * 0.06),
        attack: ci === 0 ? 2.5 : last ? 0.05 : 0.9,
        release: last ? 3 : 1.4,
        bright,
        pan: (i / (c.notes.length - 1)) * 1.2 - 0.6,
      }),
    );
    sine(b, { at: c.start, dur: c.end - c.start + 1.2, freq: midi(c.bass), amp: last ? 0.4 : 0.22, decay: last ? 2.2 : 30, attack: last ? 0.01 : 0.6 });
  });

  // bell arpeggio — sparse in scene 1, flowing through scenes 2–3, gone before the logo
  const arp = stereo(DUR);
  const pattern = [0, 2, 4, 1, 3, 2, 4, 3];
  const rnd = mulberry32(12);
  for (let t = 1.75, i = 0; t < 15.6; t += 0.25, i++) {
    if (t < 5 && i % 2) continue;
    const c = chords.find((ch) => t >= ch.start && t < ch.end);
    const note = c.notes[pattern[i % pattern.length]] + 12;
    const swellIn = Math.min(1, (t - 1.75) / 3);
    bell(arp, { at: t, freq: midi(note), amp: 0.09 * swellIn * (i % 4 === 0 ? 1 : 0.7) * (0.85 + rnd() * 0.3), decay: 0.5, pan: Math.sin(i * 0.9) * 0.6 });
  }
  pingPong(arp, { time: 0.375, feedback: 0.38, mix: 0.4 });
  mixInto(b, arp);

  const out = reverb(b, { wet: 0.38, room: 0.88, damp: 0.35 });
  out.n = DUR * SR;
  const fadeIn = SR * 1.0;
  for (let s = 0; s < fadeIn; s++) {
    out.L[s] *= s / fadeIn;
    out.R[s] *= s / fadeIn;
  }
  return finish(out, 0.85, 1.5);
};

mkdirSync(OUT, { recursive: true });
console.log('Generating sfx →', OUT);
writeWav('music', music());
writeWav('whoosh-1', whoosh(11));
writeWav('whoosh-2', whoosh(23, 0.8, false));
writeWav('whoosh-3', whoosh(37, 0.7));
writeWav('impact', impact(7));
writeWav('riser', riser(3));
writeWav('shimmer', shimmer(3));
writeWav('shimmer-soft', shimmer(8, 1.2, 25));
[86, 90, 93, 98].forEach((n, i) => writeWav(`chime-${i + 1}`, chime(n)));
writeWav('pop', pop());
writeWav('coin', coin());
writeWav('swell', swell());
writeWav('logo-hit', logoHit());
