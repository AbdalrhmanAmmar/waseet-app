import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { H, W } from '../theme';

type MotesProps = {
  seed: string;
  count: number;
  colors: string[];
  opacity?: number;
  /** px per frame upwards */
  rise?: number;
  size?: [number, number];
  area?: { x: number; y: number; w: number; h: number };
};

/** Glowing fireflies / magic dust drifting upward with a gentle sway. */
export const Motes = ({ seed, count, colors, opacity = 1, rise = 0.9, size = [3, 9], area = { x: 0, y: 0, w: W, h: H } }: MotesProps) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: string) => random(`${seed}-${k}-${i}`);
        const s = size[0] + r('s') * (size[1] - size[0]);
        const speed = rise * (0.5 + r('v'));
        const y = area.y + ((((r('y') * area.h - frame * speed) % area.h) + area.h) % area.h);
        const x = area.x + r('x') * area.w + Math.sin(frame * 0.03 * (0.5 + r('f')) + r('p') * 6) * 30;
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.05 * (0.5 + r('t')) + r('q') * 6));
        const color = colors[Math.floor(r('c') * colors.length)];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - s * 2,
              top: y - s * 2,
              width: s * 4,
              height: s * 4,
              borderRadius: '50%',
              background: `radial-gradient(circle, #fff 0%, ${color} 22%, transparent 65%)`,
              opacity: tw,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
