import { mdiCheck } from '@mdi/js';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, clamp, FONT } from '../theme';
import { Icon } from './Text';

export type IslandSpec = {
  x: number;
  y: number;
  scale: number;
  icon: string;
  label: string;
  status: { icon: string; text: string };
  /** frame the order cube lands on this island */
  arrival: number;
  seed: number;
};

const ROCK =
  'M-160 6 C-150 60 -96 96 -70 140 C-52 172 -30 196 -12 236 C-4 252 8 250 14 232 C30 188 52 168 76 128 C104 84 150 58 160 6 Z';
const FACETS = 'M-70 140 L-20 70 L14 232 M-20 70 L60 40 L76 128 M60 40 L120 30';

const Pine = ({ x, y, h, color }: { x: number; y: number; h: number; color: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-3} y={-8} width={6} height={12} fill="#0A3427" />
    <path d={`M0 ${-h} L${h * 0.32} ${-h * 0.42} L${-h * 0.32} ${-h * 0.42} Z`} fill={color} />
    <path d={`M0 ${-h * 0.72} L${h * 0.42} ${-h * 0.05} L${-h * 0.42} ${-h * 0.05} Z`} fill={color} />
  </g>
);

export const islandBob = (frame: number, index: number) => Math.sin(frame / 24 + index * 1.4) * 9;

export const Island = ({ spec, index }: { spec: IslandSpec; index: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - index * 5, fps, config: { damping: 14, mass: 1.1 } });
  const bob = islandBob(frame, index);
  const since = frame - spec.arrival;
  const active = since >= 0;
  const pulse = interpolate(since, [0, 26], [0, 1], clamp);
  const beam = active ? interpolate(since, [0, 5, 40], [0, 0.75, 0.28], clamp) : 0;
  const bump = active ? spring({ frame: since, fps, config: { damping: 9 } }) : 0;
  const chip = active ? spring({ frame: since - 2, fps, config: { damping: 13, mass: 0.8 } }) : 0;
  const crystalSway = Math.sin(frame / 14 + index) * 4;

  return (
    <div
      style={{
        position: 'absolute',
        left: spec.x,
        top: spec.y + bob + (1 - enter) * 320,
        opacity: Math.min(1, enter * 1.4),
        transform: `scale(${spec.scale})`,
        transformOrigin: '0 0',
      }}
    >
      {/* activation beam */}
      <div
        style={{
          position: 'absolute',
          left: -80,
          top: -620,
          width: 160,
          height: 620,
          opacity: beam,
          background: `linear-gradient(0deg, rgba(109,209,187,0.55), rgba(109,209,187,0) 90%)`,
          filter: 'blur(14px)',
        }}
      />
      <svg viewBox="-220 -260 440 560" width={440} height={560} style={{ position: 'absolute', left: -220, top: -260, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`rock-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.primary800} />
            <stop offset="1" stopColor="#041A12" />
          </linearGradient>
          <radialGradient id={`grass-${index}`} cx="0.45" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#3FB28F" />
            <stop offset="0.6" stopColor={C.primary400} />
            <stop offset="1" stopColor={C.primary} />
          </radialGradient>
        </defs>
        <ellipse cx={0} cy={250} rx={170} ry={36} fill={C.secondary} opacity={0.12} />
        <path d={ROCK} fill={`url(#rock-${index})`} />
        <path d={FACETS} fill="none" stroke="#fff" strokeOpacity={0.07} strokeWidth={2} />
        {[
          [-62, 150, 14],
          [40, 160, 10],
          [4, 246, 8],
        ].map(([cx, cy, s], k) => (
          <g key={k} transform={`translate(${cx + (k === 2 ? 0 : crystalSway)} ${cy + 14})`}>
            <circle r={s * 2.2} fill={C.secondary300} opacity={0.18} />
            <path d={`M0 ${-s} L${s * 0.55} 0 L0 ${s * 1.4} L${-s * 0.55} 0 Z`} fill={k === 1 ? C.accentLight : C.secondary300} />
          </g>
        ))}
        <ellipse cx={0} cy={14} rx={160} ry={46} fill={C.primary800} />
        <ellipse cx={0} cy={0} rx={160} ry={46} fill={`url(#grass-${index})`} stroke={C.secondary300} strokeOpacity={0.5} strokeWidth={2} />
        <ellipse cx={-20} cy={-8} rx={96} ry={22} fill="#fff" opacity={0.06} />
        <Pine x={-118} y={-2} h={64} color={C.primary300} />
        <Pine x={-92} y={14} h={44} color="#2A8A76" />
        <Pine x={124} y={2} h={50} color="#2A8A76" />
        {pulse > 0 && pulse < 1 && (
          <ellipse cx={0} cy={0} rx={160 * (0.4 + pulse * 0.9)} ry={46 * (0.4 + pulse * 0.9)} fill="none" stroke={C.accentLight} strokeWidth={6 * (1 - pulse)} opacity={1 - pulse} />
        )}
      </svg>

      {/* role badge */}
      <div
        style={{
          position: 'absolute',
          left: -110,
          top: -150 + Math.sin(frame / 18 + index) * 5,
          width: 104,
          height: 104,
          borderRadius: 52,
          background: C.background,
          border: `4px solid ${active ? C.accent : C.mint}`,
          boxShadow: `0 0 ${30 + bump * 30}px rgba(${active ? '242,154,74' : '109,209,187'},0.55), 0 14px 30px rgba(0,0,0,0.35)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${1 + Math.sin(Math.min(1, bump) * Math.PI) * 0.15})`,
        }}
      >
        <Icon path={spec.icon} size={56} color={C.primary} />
      </div>

      {/* role label */}
      <div
        style={{
          position: 'absolute',
          top: 262,
          left: -200,
          width: 400,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 32,
          color: C.background,
          textShadow: '0 2px 18px rgba(0,0,0,0.6)',
        }}
      >
        {spec.label}
      </div>

      {/* status chip (app-style card) */}
      {chip > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: -200,
            top: -290,
            width: 400,
            display: 'flex',
            justifyContent: 'center',
            opacity: Math.min(1, chip * 1.5),
            transform: `translateY(${(1 - chip) * 40}px) scale(${0.7 + chip * 0.3})`,
          }}
        >
          <div
            style={{
              direction: 'rtl',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 24px 14px 18px',
              borderRadius: 18,
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: '0 18px 40px rgba(0,0,0,0.35), 0 0 30px rgba(242,154,74,0.25)',
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 30,
              color: C.ink,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 14, background: C.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={spec.status.icon} size={28} color={C.primary} />
            </div>
            {spec.status.text}
            <div style={{ width: 26, height: 26, borderRadius: 13, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={mdiCheck} size={18} color="#fff" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
