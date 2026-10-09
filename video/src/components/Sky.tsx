import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { C, H, W } from '../theme';

const STARS = Array.from({ length: 180 }, (_, i) => {
  const depth = random(`depth-${i}`);
  return {
    x: random(`x-${i}`) * W,
    y: random(`y-${i}`) * H,
    r: 0.6 + depth * 1.9,
    depth,
    speed: 0.04 + random(`tw-${i}`) * 0.1,
    phase: random(`ph-${i}`) * Math.PI * 2,
    warm: random(`c-${i}`) > 0.82,
  };
});

const GLINTS = STARS.filter((s) => s.depth > 0.93);

const Aurora = ({ frame }: { frame: number }) => {
  const blobs = [
    { x: 520, y: 260, w: 1500, h: 520, color: 'rgba(61,191,163,0.30)', sx: 0.011, ax: 140 },
    { x: 1400, y: 360, w: 1300, h: 600, color: 'rgba(20,125,100,0.55)', sx: 0.008, ax: 180 },
    { x: 980, y: 980, w: 1700, h: 520, color: 'rgba(242,154,74,0.16)', sx: 0.006, ax: 120 },
  ];
  return (
    <AbsoluteFill style={{ filter: 'blur(90px)', mixBlendMode: 'screen' }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: b.w,
            height: b.h,
            left: b.x - b.w / 2 + Math.sin(frame * b.sx + i) * b.ax,
            top: b.y - b.h / 2 + Math.cos(frame * b.sx * 1.3 + i) * 50,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${b.color}, transparent)`,
            transform: `rotate(${Math.sin(frame * 0.004 + i) * 12 - 8}deg)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Night sky shared by every scene: gradient, aurora, parallax stars, vignette and grain. */
export const Sky = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.night} 0%, #0A3427 55%, ${C.deep} 100%)` }}>
      <Aurora frame={frame} />
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {STARS.map((s, i) => {
          const x = (((s.x - frame * 0.25 * s.depth) % W) + W) % W;
          const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase));
          return <circle key={i} cx={x} cy={s.y} r={s.r} fill={s.warm ? C.accentLight : '#EAF7F1'} opacity={tw * (0.35 + s.depth * 0.65)} />;
        })}
        {GLINTS.map((s, i) => {
          const x = (((s.x - frame * 0.25 * s.depth) % W) + W) % W;
          const k = 0.5 + 0.5 * Math.sin(frame * s.speed * 1.3 + s.phase);
          const L = 10 + 16 * k;
          return (
            <g key={i} opacity={0.35 + 0.65 * k} stroke="#F8FAF7" strokeLinecap="round">
              <line x1={x - L} y1={s.y} x2={x + L} y2={s.y} strokeWidth={1.2} />
              <line x1={x} y1={s.y - L} x2={x} y2={s.y + L} strokeWidth={1.2} />
            </g>
          );
        })}
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,10,6,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

/** Subtle animated film grain over everything. */
export const Grain = ({ opacity = 0.06 }: { opacity?: number }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <svg width={W} height={H}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
