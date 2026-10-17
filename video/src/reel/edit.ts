import { FPS } from './theme';

/** A kept range of the source footage, in source frames [from, to). */
export type Cut = { from: number; to: number; zoom?: number };

export type Placed = Cut & { at: number; len: number };

export const place = (cuts: Cut[]): Placed[] => {
  let at = 0;
  return cuts.map((c) => {
    const p = { ...c, at, len: c.to - c.from };
    at += p.len;
    return p;
  });
};

export const totalFrames = (placed: Placed[]) => placed.reduce((n, p) => n + p.len, 0);

/** Source seconds → timeline seconds; null when the moment was cut out. */
export const srcToTimeline = (placed: Placed[], sec: number): number | null => {
  const f = sec * FPS;
  const p = placed.find((c) => f >= c.from && f < c.to);
  return p ? (p.at + (f - p.from)) / FPS : null;
};

/** Like srcToTimeline but snaps cut-out moments to the next kept frame. */
export const srcToTimelineSnap = (placed: Placed[], sec: number): number => {
  const f = sec * FPS;
  const p = placed.find((c) => f < c.to);
  if (!p) return totalFrames(placed) / FPS;
  return (p.at + Math.max(0, f - p.from)) / FPS;
};

/** Source seconds → timeline frame (snapped). */
export const tf = (placed: Placed[], sec: number) => Math.round(srcToTimelineSnap(placed, sec) * FPS);
