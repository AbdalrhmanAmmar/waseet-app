import type { CSSProperties } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, FONT } from '../theme';

type WordsProps = {
  text: string;
  start: number;
  size: number;
  color: string;
  weight?: 400 | 500 | 700;
  stagger?: number;
  exitAt?: number;
  glow?: string;
  justify?: CSSProperties['justifyContent'];
  style?: CSSProperties;
};

/**
 * Arabic text revealed word by word (right to left). Words are never split into letters
 * so Arabic shaping stays intact.
 */
export const Words = ({ text, start, size, color, weight = 700, stagger = 4, exitAt, glow, justify = 'center', style }: WordsProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = exitAt === undefined ? 0 : interpolate(frame, [exitAt, exitAt + 14], [0, 1], clamp);
  return (
    <div
      style={{
        direction: 'rtl',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: justify,
        columnGap: size * 0.26,
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.25,
        color,
        textShadow: glow,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 24}px)`,
        filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
        ...style,
      }}
    >
      {text.split(' ').map((word, i) => {
        const p = spring({ frame: frame - start - i * stagger, fps, config: { damping: 16, mass: 0.7 } });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: interpolate(p, [0, 0.6], [0, 1], clamp),
              transform: `translateY(${(1 - p) * size * 0.55}px) scale(${0.9 + p * 0.1})`,
              filter: p < 0.98 ? `blur(${(1 - Math.min(p, 1)) * 12}px)` : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const Icon = ({ path, size, color }: { path: string; size: number; color: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
    <path d={path} fill={color} />
  </svg>
);
