import { interpolate, spring } from 'remotion';
import { clamp, EASE, FPS, OUT } from './theme';

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, from: number, to: number, e: (t: number) => number = EASE) => e(interpolate(f, [from, to], [0, 1], clamp));

/** Soft spring 0→1 starting at `at` (no overshoot by default, gentle overshoot with lower damping). */
export const sp = (f: number, at: number, damping = 18, mass = 0.8, stiffness = 120) =>
  spring({ frame: f - at, fps: FPS, config: { damping, mass, stiffness } });

/** Press feedback: 1 → 0.95 → 1 around frame `at`. */
export const press = (f: number, at: number) => interpolate(f, [at - 3, at, at + 5], [1, 0.95, 1], clamp);

/** Typed text: reveals `text` between `from` and `to` (by grapheme so Arabic shaping stays intact while typing). */
export const typed = (f: number, text: string, from: number, to: number) => {
  const chars = Array.from(text);
  const n = Math.round(interpolate(f, [from, to], [0, chars.length], clamp));
  return chars.slice(0, n).join('');
};

/** Count-up for numbers. */
export const count = (f: number, value: number, from: number, to: number) => value * prog(f, from, to, OUT);

// ─── camera ─────────────────────────────────────────────────────────────────
// A camera key says: from frame `at`, glide (over `dur`) until point (x, y) of the device
// — in the device's own pixels, measured from its centre — sits at the rig's anchor, scaled by `s`.
export type CamKey = { at: number; s: number; x: number; y: number; dur?: number };

export const camera = (f: number, keys: CamKey[]) => {
  let s = keys[0].s;
  let x = keys[0].x;
  let y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.at) break;
    const p = prog(f, k.at, k.at + (k.dur ?? 18));
    s = lerp(s, k.s, p);
    x = lerp(x, k.x, p);
    y = lerp(y, k.y, p);
  }
  return { s, x, y };
};

// ─── focus highlight ────────────────────────────────────────────────────────
export type FocusKey = { at: number; until: number; x: number; y: number; w: number; h: number; r?: number };

/** Active highlight rect (with 0..1 strength) — glides between consecutive rects. */
export const focus = (f: number, keys: FocusKey[]) => {
  const live = keys.filter((k) => f >= k.at - 8 && f < k.until + 8);
  if (!live.length) return null;
  const k = live[live.length - 1];
  const prev = keys[keys.indexOf(k) - 1];
  const on = interpolate(f, [k.at - 8, k.at + 4, k.until, k.until + 8], [0, 1, 1, 0], clamp);
  // glide from the previous rect when they touch
  if (prev && prev.until >= k.at - 2) {
    const p = prog(f, k.at - 6, k.at + 8);
    return {
      on: 1 * interpolate(f, [k.until, k.until + 8], [1, 0], clamp),
      x: lerp(prev.x, k.x, p),
      y: lerp(prev.y, k.y, p),
      w: lerp(prev.w, k.w, p),
      h: lerp(prev.h, k.h, p),
      r: lerp(prev.r ?? 18, k.r ?? 18, p),
    };
  }
  return { on, x: k.x, y: k.y, w: k.w, h: k.h, r: k.r ?? 18 };
};

// ─── pointer ────────────────────────────────────────────────────────────────
export type PointerKey = { at: number; x: number; y: number; click?: boolean; travel?: number };

/** Pointer position at frame f: arrives at each key at `at`, travelling for `travel` frames before it. */
export const pointer = (f: number, keys: PointerKey[]) => {
  let x = keys[0].x;
  let y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const start = k.at - (k.travel ?? 14);
    if (f < start) break;
    const p = prog(f, start, k.at);
    // slight arc so the move doesn't read as a straight robotic line
    const arc = Math.sin(p * Math.PI) * Math.min(40, Math.hypot(k.x - x, k.y - y) * 0.12);
    const nx = lerp(x, k.x, p);
    const ny = lerp(y, k.y, p) - arc;
    x = f >= k.at ? k.x : nx;
    y = f >= k.at ? k.y : ny;
  }
  const clicks = keys.filter((k) => k.click).map((k) => k.at);
  return { x, y, clicks };
};

/** Smooth float for idle devices. */
export const float = (f: number, amp = 1) => ({
  y: Math.sin(f / 38) * 9 * amp,
  rx: Math.sin(f / 47 + 1) * 1.6 * amp,
  ry: Math.sin(f / 59) * 2.4 * amp,
});
