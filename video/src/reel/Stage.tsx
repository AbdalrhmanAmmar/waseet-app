import { createContext, useContext, type ReactNode } from 'react';
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Icon } from '../components/Text';
import { C, CAPTION_FONT, clamp, UH, UW } from './theme';

const DOTS = Array.from({ length: 26 }, (_, i) => ({
  x: random(`sx-${i}`) * UW,
  y: random(`sy-${i}`) * UH,
  r: 2 + random(`sr-${i}`) * 4,
  v: 0.3 + random(`sv-${i}`) * 0.8,
  warm: i % 4 === 0,
}));

/** Lets the timeline tell a stage whether it borders another stage (no backdrop open/close then). */
export const StageEdges = createContext({ enter: true, exit: true });

/**
 * Full-screen brand stage that takes over b-roll moments: deep-green glass over the
 * blurred footage, soft light, floating dust, a label chip and the mockup content.
 */
export const Stage = ({
  duration,
  label,
  icon,
  children,
  enter: enterProp,
  exit: exitProp,
}: {
  duration: number;
  label: string;
  icon: string;
  children: ReactNode;
  /** false when the previous insert is also a stage, so the backdrop doesn't flash the footage */
  enter?: boolean;
  exit?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const edges = useContext(StageEdges);
  const enter = enterProp ?? edges.enter;
  const exit = exitProp ?? edges.exit;
  const open = enter ? Easing.out(Easing.cubic)(interpolate(frame, [0, 14], [0, 1], clamp)) : 1;
  const close = exit ? Easing.in(Easing.cubic)(interpolate(frame, [duration - 10, duration], [0, 1], clamp)) : 0;
  const swapOut = exit ? 0 : interpolate(frame, [duration - 8, duration], [0, 1], clamp);
  const reveal = open * (1 - close);
  const chip = spring({ frame: frame - 6, fps, config: { damping: 13 } });
  const inset = (1 - reveal) * 50;

  return (
    <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${inset}% 0 ${inset}% 0 round ${60 * (1 - reveal)}px)` }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 70% at 50% 30%, rgba(33,137,111,0.86) 0%, rgba(16,62,50,0.93) 45%, rgba(6,38,29,0.97) 100%)`,
        }}
      />
      <svg width={UW} height={UH} style={{ position: 'absolute', opacity: 0.18 }}>
        <defs>
          <pattern id="stage-grid" width={60} height={60} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${frame * 0.6})`}>
            <path d="M60 0H0V60" fill="none" stroke={C.mint} strokeWidth={1} />
          </pattern>
          <radialGradient id="stage-fade">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="stage-mask">
            <rect width={UW} height={UH} fill="url(#stage-fade)" />
          </mask>
        </defs>
        <rect width={UW} height={UH} fill="url(#stage-grid)" mask="url(#stage-mask)" />
      </svg>
      <div style={{ position: 'absolute', left: -200, top: 1100, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(242,154,74,0.22), transparent)' }} />
      <div style={{ position: 'absolute', right: -260, top: 120, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(109,209,187,0.25), transparent)' }} />
      {DOTS.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.x + Math.sin(frame / 30 + i) * 20,
            top: (((d.y - frame * d.v) % UH) + UH) % UH,
            width: d.r * 2,
            height: d.r * 2,
            borderRadius: '50%',
            background: d.warm ? C.accentLight : C.mint,
            opacity: 0.35 + 0.35 * Math.sin(frame / 12 + i),
            boxShadow: `0 0 ${d.r * 4}px ${d.warm ? C.accent : C.secondary300}`,
          }}
        />
      ))}

      <div style={{ position: 'absolute', top: 250, width: UW, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 30px 14px 24px',
            borderRadius: 999,
            background: 'rgba(237,246,241,0.12)',
            border: '2px solid rgba(198,231,219,0.3)',
            fontFamily: CAPTION_FONT,
            fontWeight: 800,
            fontSize: 40,
            color: '#fff',
            opacity: Math.min(1, chip * 1.4) * (1 - close) * (1 - swapOut),
            transform: `translateY(${(1 - chip) * -30}px)`,
          }}
        >
          <div style={{ width: 54, height: 54, borderRadius: 18, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon path={icon} size={34} color="#fff" />
          </div>
          {label}
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: (1 - close) * (1 - swapOut), transform: swapOut ? `scale(${1 - swapOut * 0.05})` : undefined }}>{children}</div>
    </div>
  );
};

/** Floating feature card that pops in near the mockup. */
export const Callout = ({
  icon,
  title,
  sub,
  x,
  y,
  at,
  until,
  accent = false,
  width = 460,
}: {
  icon: string;
  title: string;
  sub?: string;
  x: number;
  y: number;
  at: number;
  until?: number;
  accent?: boolean;
  width?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 12, mass: 0.7 } });
  const out = until === undefined ? 0 : interpolate(frame, [until - 8, until], [0, 1], clamp);
  if (frame < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        direction: 'rtl',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '22px 26px',
        borderRadius: 30,
        background: accent ? `linear-gradient(135deg, ${C.accent}, #E07F33)` : C.surface,
        boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
        opacity: Math.min(1, p * 1.5) * (1 - out),
        transform: `translateY(${(1 - p) * 60 + Math.sin((frame - at) / 18) * 6}px) scale(${0.7 + p * 0.3}) rotate(${(1 - p) * -4}deg)`,
      }}
    >
      <div style={{ width: 76, height: 76, flexShrink: 0, borderRadius: 24, background: accent ? 'rgba(255,255,255,0.2)' : C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon path={icon} size={46} color={accent ? '#fff' : C.primary} />
      </div>
      <div>
        <div style={{ fontFamily: 'Tajawal', fontWeight: 700, fontSize: 38, lineHeight: 1.2, color: accent ? '#fff' : C.ink }}>{title}</div>
        {sub && <div style={{ fontFamily: 'Tajawal', fontWeight: 500, fontSize: 27, color: accent ? 'rgba(255,255,255,0.85)' : C.muted }}>{sub}</div>}
      </div>
    </div>
  );
};
