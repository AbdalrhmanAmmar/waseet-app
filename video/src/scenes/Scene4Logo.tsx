import { AbsoluteFill, Easing, interpolate, interpolateColors, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CubeFaces, LOGO } from '../components/Cube';
import { Words } from '../components/Text';
import { C, clamp, FONT, H, W } from '../theme';
import { MAIN_NODES, MAIN_R } from './Scene3Constellation';

export const HIT = 52;
const CX = 960;
const CY = 390;
const S = 6.4;

const GATHER = Array.from({ length: 46 }, (_, i) => {
  const a = random(`g-a-${i}`) * Math.PI * 2;
  const d = 520 + random(`g-d-${i}`) * 520;
  return { x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d * 0.7, start: random(`g-s-${i}`) * 26, size: 4 + random(`g-z-${i}`) * 7, warm: i % 3 === 0 };
});

const BURST = Array.from({ length: 40 }, (_, i) => {
  const a = random(`b-a-${i}`) * Math.PI * 2;
  return {
    a,
    d: 260 + random(`b-d-${i}`) * 620,
    size: 6 + random(`b-z-${i}`) * 10,
    spin: (random(`b-r-${i}`) - 0.5) * 8,
    color: [C.accent, C.primary300, C.secondary, C.accentLight][i % 4],
    diamond: i % 2 === 0,
  };
});

const nodeTravel = (frame: number, i: number) =>
  Easing.bezier(0.65, 0, 0.25, 1.12)(interpolate(frame, [i * 3, 32 + i * 3], [0, 1], clamp));

export const Scene4Logo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const assemble = Easing.in(Easing.cubic)(interpolate(frame, [28, HIT], [0, 1], clamp));
  const after = frame >= HIT;
  const settle = after ? spring({ frame: frame - HIT, fps, config: { damping: 7, stiffness: 160 } }) : 0;
  const punch = after ? 0.95 + 0.05 * settle : 1 - 0.05 * assemble;
  const scale = S * punch;
  const toLogo = (p: { x: number; y: number }) => ({ x: (p.x - CX) / scale + 32, y: (p.y - CY) / scale + 32 });

  const dawnR = interpolate(frame, [HIT, HIT + 26], [0, 2300], { ...clamp, easing: Easing.out(Easing.cubic) });
  const night = interpolate(frame, [HIT, HIT + 18], [1, 0], clamp);
  const nodeColor = interpolateColors(frame, [HIT, HIT + 14], [C.secondary300, C.primary]);
  const flash = interpolate(frame, [HIT - 1, HIT + 1, HIT + 18], [0, 0.95, 0], clamp);
  const connectors = interpolate(frame, [HIT, HIT + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const arcs = interpolate(frame, [HIT + 2, HIT + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const edges = interpolate(frame, [HIT, HIT + 14], [0, 1], clamp);
  const core = interpolate(frame, [14, HIT], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const word = interpolate(frame, [80, 104], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bar = interpolate(frame, [94, 116], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const glint = interpolate(frame, [116, 136], [-16, 52], clamp);
  const hold = 1 + Math.max(0, frame - 80) * 0.0004;
  const float = after ? Math.sin((frame - HIT) / 22) * 4 : 0;

  return (
    <AbsoluteFill style={{ transform: `scale(${hold})` }}>
      {/* dawn: the night opens into the brand's light background */}
      <AbsoluteFill
        style={{
          clipPath: `circle(${dawnR}px at ${CX}px ${CY}px)`,
          background: `radial-gradient(circle at ${CX}px ${CY}px, #FFFFFF 0%, ${C.background} 42%, ${C.soft} 100%)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: CX - 1000,
            top: CY - 1000,
            width: 2000,
            height: 2000,
            opacity: 0.9,
            background: `repeating-conic-gradient(from ${frame * 0.2}deg, rgba(255,241,226,0.9) 0deg 5deg, transparent 5deg 15deg)`,
            WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 50%)',
            maskImage: 'radial-gradient(circle, #000 0%, transparent 50%)',
          }}
        />
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(242,154,74,0.16) 0%, transparent 28%)` }} />
      </AbsoluteFill>

      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {/* reveal edge + shockwaves */}
        {after && dawnR < 2200 && <circle cx={CX} cy={CY} r={dawnR} fill="none" stroke={C.accentLight} strokeWidth={14} opacity={0.6 * (1 - dawnR / 2300)} />}
        {[0, 6].map((d, i) => {
          const p = interpolate(frame, [HIT + d, HIT + d + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          if (p <= 0 || p >= 1) return null;
          return <circle key={i} cx={CX} cy={CY} r={60 + p * 520} fill="none" stroke={i ? C.secondary : C.accent} strokeWidth={8 * (1 - p)} opacity={1 - p} />;
        })}

        {/* energy gathering into the core */}
        {GATHER.map((g, i) => {
          const p = Easing.in(Easing.quad)(interpolate(frame, [g.start, g.start + 26], [0, 1], clamp));
          if (p <= 0 || p >= 1) return null;
          return (
            <circle
              key={i}
              cx={g.x + (CX - g.x) * p}
              cy={g.y + (CY + 22 - g.y) * p}
              r={g.size * (1 - p * 0.6)}
              fill={g.warm ? C.accentLight : C.mint}
              opacity={Math.sin(p * Math.PI) * 0.9}
            />
          );
        })}
        <defs>
          <radialGradient id="core-glow">
            <stop offset="0" stopColor="#FFE3C4" stopOpacity={0.9} />
            <stop offset="0.35" stopColor={C.accent} stopOpacity={0.45} />
            <stop offset="1" stopColor={C.accent} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="node-glow">
            <stop offset="0" stopColor={C.secondary300} stopOpacity={0.55} />
            <stop offset="1" stopColor={C.secondary300} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY + 22} r={60 + core * 260} fill="url(#core-glow)" opacity={core * night} />

        {/* the logo, built in its own 64-unit space */}
        <g transform={`translate(${CX} ${CY + float}) scale(${scale}) translate(-32 -32)`}>
          <g transform={`rotate(${(1 - arcs) * -70} 32 32)`}>
            {LOGO.arcs.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - arcs} />
            ))}
          </g>
          {LOGO.connectors.map((d, i) => (
            <path key={i} d={d} stroke={C.primary} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - connectors} />
          ))}
          <g opacity={assemble > 0 ? 1 : 0}>
            <CubeFaces id="s4-cube" assemble={assemble} edges={edges} shaded={!after} />
          </g>
          <defs>
            <clipPath id="cube-clip">
              <path d="M22 29.5 32 24l10 5.5v12L32 47l-10-5.5v-12Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#cube-clip)" opacity={glint > -16 && glint < 52 ? 1 : 0}>
            <rect x={glint} y={20} width={4} height={34} fill="#fff" opacity={0.55} transform={`rotate(25 ${glint} 35)`} />
          </g>
          {LOGO.nodes.map((target, i) => {
            const t = nodeTravel(frame, i);
            const from = toLogo(MAIN_NODES[i]);
            const r = MAIN_R / scale + (LOGO.nodeR - MAIN_R / scale) * Math.min(1, t);
            const x = from.x + (target.x - from.x) * t;
            const y = from.y + (target.y - from.y) * t;
            return (
              <g key={i}>
                {t < 1 &&
                  [1, 2, 3, 4, 5].map((k) => {
                    const tk = nodeTravel(frame - k * 1.2, i);
                    return (
                      <circle key={k} cx={from.x + (target.x - from.x) * tk} cy={from.y + (target.y - from.y) * tk} r={r * (1 - k * 0.15)} fill={C.secondary300} opacity={0.25 - k * 0.04} />
                    );
                  })}
                <circle cx={x} cy={y} r={r * 3} fill="url(#node-glow)" opacity={night} />
                <circle cx={x} cy={y} r={r} fill={nodeColor} />
              </g>
            );
          })}
        </g>

        {/* celebratory burst on the light background */}
        {after &&
          BURST.map((b, i) => {
            const p = Easing.out(Easing.cubic)(interpolate(frame, [HIT, HIT + 60], [0, 1], clamp));
            const fade = interpolate(frame, [HIT + 30, 150], [1, 0], clamp);
            const x = CX + Math.cos(b.a) * b.d * p;
            const y = CY + Math.sin(b.a) * b.d * p * 0.75 + (frame - HIT) * 0.6;
            const s = b.size * (1 - p * 0.3);
            return b.diamond ? (
              <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} fill={b.color} opacity={fade} transform={`rotate(${45 + (frame - HIT) * b.spin} ${x} ${y})`} />
            ) : (
              <circle key={i} cx={x} cy={y} r={s / 2} fill={b.color} opacity={fade} />
            );
          })}
      </svg>

      {/* wordmark */}
      <div style={{ position: 'absolute', top: 596, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 168,
            lineHeight: 1.1,
            color: C.deep,
            opacity: Math.min(1, word * 2),
            transform: `translateY(${(1 - word) * 40}px)`,
            clipPath: `inset(-20% -5% -20% ${(1 - word) * 100}%)`,
          }}
        >
          وسيط
        </div>
        <div style={{ width: 150 * bar, height: 8, borderRadius: 4, background: C.accent, marginTop: 4 }} />
        <Words text="تفاصيل أقل، إنجاز أكثر" start={100} stagger={4} size={46} weight={500} color={C.muted} style={{ marginTop: 22 }} />
      </div>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,255,255,${flash}) 0%, rgba(255,241,226,${flash * 0.7}) 40%, rgba(255,241,226,${flash * 0.3}) 100%)` }} />
    </AbsoluteFill>
  );
};
