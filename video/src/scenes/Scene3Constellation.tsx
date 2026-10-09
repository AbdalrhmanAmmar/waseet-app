import {
  mdiAccountTieOutline,
  mdiChartBoxOutline,
  mdiEyeOutline,
  mdiRefresh,
  mdiStorefrontOutline,
  mdiTrendingUp,
  mdiTruckFastOutline,
} from '@mdi/js';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Icon, Words } from '../components/Text';
import { C, clamp, FONT, H, W } from '../theme';

/** The three stars that become the logo's nodes in scene 4. */
export const MAIN_NODES = [
  { x: 1500, y: 170 },
  { x: 210, y: 890 },
  { x: 1730, y: 905 },
];
export const MAIN_R = 18;
export const COIN_FRAME = 88;

const NODES = [
  ...MAIN_NODES,
  { x: 960, y: 120 },
  { x: 620, y: 190 },
  { x: 300, y: 250 },
  { x: 110, y: 540 },
  { x: 975, y: 470 },
  { x: 930, y: 820 },
  { x: 600, y: 965 },
  { x: 1240, y: 970 },
  { x: 1870, y: 600 },
  { x: 1810, y: 280 },
  { x: 1190, y: 290 },
  { x: 1000, y: 650 },
];
const EDGES: [number, number][] = [
  [0, 3], [0, 13], [0, 12], [3, 4], [4, 5], [5, 6], [6, 1], [1, 9], [9, 8], [8, 10],
  [10, 2], [2, 11], [11, 12], [13, 7], [7, 14], [14, 8], [3, 13], [14, 10],
];
const ROLE_NODES = [
  { node: 4, icon: mdiStorefrontOutline },
  { node: 3, icon: mdiAccountTieOutline },
  { node: 11, icon: mdiChartBoxOutline },
  { node: 9, icon: mdiTruckFastOutline },
];
const ROLES = [
  { icon: mdiStorefrontOutline, label: 'التاجر' },
  { icon: mdiAccountTieOutline, label: 'المبيعات' },
  { icon: mdiChartBoxOutline, label: 'الإدارة' },
  { icon: mdiTruckFastOutline, label: 'المندوب' },
];
export const ROLE_POP_FRAMES = ROLES.map((_, i) => 64 + i * 6);

const SPARK = [8, 14, 11, 22, 19, 30, 27, 41, 37, 52, 60, 74, 88];

const Network = ({ frame, fade }: { frame: number; fade: number }) => {
  const { fps } = useVideoConfig();
  return (
    <svg width={W} height={H} style={{ position: 'absolute' }}>
      {EDGES.map(([a, b], i) => {
        const p = interpolate(frame, [4 + i * 3, 22 + i * 3], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
        if (p <= 0) return null;
        const A = NODES[a];
        const B = NODES[b];
        const t = ((frame * 0.018 + i * 0.37) % 1 + 1) % 1;
        return (
          <g key={i} opacity={fade}>
            <line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * p} y2={A.y + (B.y - A.y) * p} stroke={C.primary300} strokeOpacity={0.4} strokeWidth={1.6} />
            {p >= 1 && (
              <circle cx={A.x + (B.x - A.x) * t} cy={A.y + (B.y - A.y) * t} r={3.5} fill={i % 3 ? C.mint : C.accentLight} opacity={Math.sin(t * Math.PI)} />
            )}
          </g>
        );
      })}
      {NODES.map((n, i) => {
        if (i < MAIN_NODES.length) return null;
        const s = spring({ frame: frame - 2 - i * 2, fps, config: { damping: 12 } });
        const tw = 0.6 + 0.4 * Math.sin(frame / 9 + i);
        return (
          <g key={i} opacity={fade * Math.min(1, s)}>
            <circle cx={n.x} cy={n.y} r={16 * s} fill={C.secondary300} opacity={0.15 * tw} />
            <circle cx={n.x} cy={n.y} r={5 * s} fill={C.mint} />
          </g>
        );
      })}
    </svg>
  );
};

export const MainStars = ({ frame, glow = 1 }: { frame: number; glow?: number }) => (
  <svg width={W} height={H} style={{ position: 'absolute' }}>
    {MAIN_NODES.map((n, i) => {
      const halo = 1 + 0.25 * Math.sin(frame / 7 + i * 2);
      return (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={MAIN_R * 3.2 * halo} fill={C.secondary} opacity={0.12 * glow} />
          <circle cx={n.x} cy={n.y} r={MAIN_R * 1.8} fill={C.secondary300} opacity={0.22 * glow} />
          <circle cx={n.x} cy={n.y} r={MAIN_R} fill={C.secondary300} />
          <circle cx={n.x - 5} cy={n.y - 5} r={MAIN_R * 0.35} fill="#fff" opacity={0.8} />
        </g>
      );
    })}
  </svg>
);

const BalanceCard = ({ frame }: { frame: number }) => {
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 10, fps, config: { damping: 15, mass: 1.1 } });
  const value = 12480.5 * Easing.out(Easing.cubic)(interpolate(frame, [30, COIN_FRAME], [0, 1], clamp));
  const draw = interpolate(frame, [40, 96], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const shine = interpolate(frame, [92, 116], [-0.4, 1.4], clamp);
  const pts = SPARK.map((v, i) => [20 + (i / (SPARK.length - 1)) * 560, 100 - v]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const done = frame >= COIN_FRAME;
  const coinPop = done ? spring({ frame: frame - COIN_FRAME, fps, config: { damping: 8 } }) : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: 170,
        top: 320,
        width: 680,
        height: 410,
        perspective: 1600,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 26,
          overflow: 'hidden',
          direction: 'rtl',
          padding: '34px 40px',
          boxSizing: 'border-box',
          background: `linear-gradient(225deg, ${C.deep} 0%, ${C.deepCard} 100%)`,
          border: '1.5px solid rgba(198,231,219,0.28)',
          boxShadow: '0 50px 120px rgba(0,0,0,0.5), 0 0 90px rgba(61,191,163,0.22)',
          opacity: Math.min(1, enter * 1.5),
          transform: `translateX(${(1 - enter) * -160}px) rotateY(${12 + (1 - enter) * 30 + Math.sin(frame / 20) * 2}deg) rotateX(${Math.sin(frame / 26) * 2}deg) translateY(${Math.sin(frame / 18) * 8}px)`,
          fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 500, color: C.mint }}>رصيد حسابك</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[mdiEyeOutline, mdiRefresh].map((p) => (
              <div key={p} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon path={p} size={26} color="#fff" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ direction: 'ltr', textAlign: 'right', marginTop: 14, color: '#fff', fontWeight: 700, fontSize: 92, lineHeight: 1.1, transform: `scale(${1 + Math.sin(Math.min(coinPop, 1) * Math.PI) * 0.05})`, transformOrigin: '100% 50%' }}>
          <span style={{ fontSize: 30, color: C.mint, marginRight: 14 }}>USD</span>
          {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <svg width={600} height={110} style={{ display: 'block', marginTop: 8, direction: 'ltr' }}>
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={C.accent} stopOpacity={0.35} />
              <stop offset="1" stopColor={C.accent} stopOpacity={0} />
            </linearGradient>
            <clipPath id="spark-clip">
              <rect x={0} y={0} width={600 * draw} height={110} />
            </clipPath>
          </defs>
          <g clipPath="url(#spark-clip)">
            <path d={`${line} L580 110 L20 110 Z`} fill="url(#spark-fill)" />
            <path d={line} fill="none" stroke={C.accent} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
          </g>
          {draw > 0.98 && <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r={8} fill={C.accentLight} stroke="#fff" strokeWidth={3} />}
        </svg>
        <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
          {[
            ['طلبات اليوم', '128'],
            ['نسبة التوصيل', '96%'],
          ].map(([k, v], i) => (
            <div
              key={k}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 18px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.09)',
                fontSize: 24,
                color: C.mint,
                opacity: interpolate(frame, [50 + i * 6, 62 + i * 6], [0, 1], clamp),
              }}
            >
              {i === 1 && <Icon path={mdiTrendingUp} size={24} color={C.accentLight} />}
              {k}
              <span style={{ color: '#fff', fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            top: -100,
            bottom: -100,
            width: 160,
            left: `${shine * 100}%`,
            transform: 'rotate(18deg)',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
          }}
        />
      </div>
    </div>
  );
};

const RolePills = ({ frame }: { frame: number }) => {
  const { fps } = useVideoConfig();
  return (
    <div style={{ direction: 'rtl', display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 34 }}>
      {ROLES.map((r, i) => {
        const p = spring({ frame: frame - ROLE_POP_FRAMES[i], fps, config: { damping: 11 } });
        return (
          <div
            key={r.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px 10px 16px',
              borderRadius: 999,
              background: 'rgba(237,246,241,0.1)',
              border: '1.5px solid rgba(198,231,219,0.32)',
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 28,
              color: C.background,
              opacity: Math.min(1, p * 1.4),
              transform: `scale(${0.6 + p * 0.4}) translateY(${(1 - p) * 20}px)`,
            }}
          >
            <Icon path={r.icon} size={28} color={C.accentLight} />
            {r.label}
          </div>
        );
      })}
    </div>
  );
};

export const Scene3Constellation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = Easing.out(Easing.cubic)(interpolate(frame, [0, 20], [0, 1], clamp));
  const exit = interpolate(frame, [114, 138], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const mainIn = spring({ frame: frame - 2, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: enter, transform: `scale(${1.12 - enter * 0.12})` }}>
        <Network frame={frame} fade={1 - exit} />
        <svg width={W} height={H} style={{ position: 'absolute', opacity: 1 - exit }}>
          {ROLE_NODES.map(({ node }, i) => {
            const n = NODES[node];
            const s = spring({ frame: frame - 24 - i * 5, fps, config: { damping: 11 } });
            return <circle key={i} cx={n.x} cy={n.y} r={34 * s} fill={C.deep} stroke={C.secondary300} strokeWidth={2} opacity={0.95} />;
          })}
        </svg>
        {ROLE_NODES.map(({ node, icon }, i) => {
          const n = NODES[node];
          const s = spring({ frame: frame - 24 - i * 5, fps, config: { damping: 11 } });
          return (
            <div key={i} style={{ position: 'absolute', left: n.x - 18, top: n.y - 18, opacity: (1 - exit) * Math.min(1, s), transform: `scale(${s})` }}>
              <Icon path={icon} size={36} color={C.mint} />
            </div>
          );
        })}
      </AbsoluteFill>

      <div style={{ opacity: Math.min(1, mainIn), transform: `scale(${0.5 + Math.min(1, mainIn) * 0.5})`, transformOrigin: '50% 50%', position: 'absolute', inset: 0 }}>
        <MainStars frame={frame} glow={1 + exit * 1.5} />
      </div>

      <AbsoluteFill style={{ opacity: 1 - exit, filter: exit > 0 ? `blur(${exit * 14}px)` : undefined, transform: `scale(${1 - exit * 0.06})` }}>
        <BalanceCard frame={frame} />
        <div style={{ position: 'absolute', right: 170, top: 350, width: 900 }}>
          <Words text="فريق واحد. عمل منظم." start={14} size={84} color={C.background} glow="0 0 36px rgba(109,209,187,0.4)" justify="flex-start" />
          <Words
            text="مساحة مناسبة للتاجر وموظف المبيعات والإدارة ومندوب التوصيل"
            start={32}
            stagger={2}
            size={36}
            weight={500}
            color={C.mint}
            justify="flex-start"
            style={{ marginTop: 14, maxWidth: 700, marginLeft: 'auto' }}
          />
          <RolePills frame={frame} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
