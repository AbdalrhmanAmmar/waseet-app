import { Easing, interpolate, spring } from 'remotion';
import { clamp } from '../theme';

export const pop = (frame: number, start: number, fps: number, damping = 13, mass = 0.8) =>
  spring({ frame: frame - start, fps, config: { damping, mass } });

export const ease = (frame: number, from: number, to: number, e: (t: number) => number = Easing.inOut(Easing.cubic)) =>
  e(interpolate(frame, [from, to], [0, 1], clamp));

/** 0→1 in, hold, 1→0 out — for overlays with a fixed lifetime. */
export const life = (frame: number, start: number, end: number, fade = 8) =>
  interpolate(frame, [start, start + fade, end - fade, end], [0, 1, 1, 0], clamp);
