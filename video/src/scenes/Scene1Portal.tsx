import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Cube } from '../components/Cube';
import { Motes } from '../components/Motes';
import { Words } from '../components/Text';
import { C, clamp, H, W } from '../theme';

const CX = 960;
const CY = 420;
const IMPACT = 54;

const bezier = (p: number, a: number[], b: number[], c: number[]) => [
  (1 - p) ** 2 * a[0] + 2 * (1 - p) * p * b[0] + p ** 2 * c[0],
  (1 - p) ** 2 * a[1] + 2 * (1 - p) * p * b[1] + p ** 2 * c[1],
];
const SPARK_PATH = [[1420, -90], [1260, 240], [CX, CY]];

const Spark = ({ frame }: { frame: number }) => {
  const progress = (f: number) => Easing.in(Easing.quad)(interpolate(f, [10, IMPACT], [0, 1], clamp));
  if (frame < 8 || frame > IMPACT + 2) return null;
  return (
    <AbsoluteFill>
      {Array.from({ length: 16 }, (_, k) => {
        const p = progress(frame - k * 0.8);
        if (p <= 0) return null;
        const [x, y] = bezier(p, SPARK_PATH[0], SPARK_PATH[1], SPARK_PATH[2]);
        const s = (k === 0 ? 26 : 18 - k) * (0.6 + p * 0.6);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x - s,
              top: y - s,
              width: s * 2,
              height: s * 2,
              borderRadius: '50%',
              opacity: (1 - k / 16) * (k === 0 ? 1 : 0.7),
              background: `radial-gradient(circle, #fff 0%, ${k < 3 ? C.accentLight : C.accent} 30%, transparent 70%)`,
              boxShadow: k === 0 ? `0 0 60px 20px rgba(242,154,74,0.55)` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Orbits = ({ frame, front }: { frame: number; front: boolean }) => {
  const appear = interpolate(frame, [64, 96], [0, 1], clamp);
  const rings = [
    { rx: 270, ry: 66, rot: -12, speed: 0.05, color: C.secondary300, off: 0 },
    { rx: 330, ry: 92, rot: 14, speed: -0.038, color: C.primary300, off: 2.1 },
  ];
  return (
    <svg width={W} height={H} style={{ position: 'absolute', opacity: appear }}>
      {rings.map((r, i) => {
        const beads = [0, Math.PI * 0.66, Math.PI * 1.33].map((o) => frame * r.speed + r.off + o);
        return (
          <g key={i} transform={`rotate(${r.rot} ${CX} ${CY + 10})`}>
            {!front && (
              <ellipse
                cx={CX}
                cy={CY + 10}
                rx={r.rx * (0.6 + appear * 0.4)}
                ry={r.ry * (0.6 + appear * 0.4)}
                fill="none"
                stroke={r.color}
                strokeOpacity={0.7}
                strokeWidth={3}
                strokeDasharray="4 10"
                strokeDashoffset={-frame * 1.5 * (i ? -1 : 1)}
              />
            )}
            {beads.map((t, k) => {
              const inFront = Math.sin(t) >= 0;
              if (inFront !== front) return null;
              const x = CX + Math.cos(t) * r.rx;
              const y = CY + 10 + Math.sin(t) * r.ry;
              return (
                <g key={k}>
                  <circle cx={x} cy={y} r={18} fill={r.color} opacity={0.18} />
                  <circle cx={x} cy={y} r={front ? 7 : 5} fill={k === 0 ? C.accentLight : r.color} opacity={front ? 1 : 0.55} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

export const Scene1Portal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const born = spring({ frame: frame - (IMPACT - 2), fps, config: { damping: 11, mass: 0.9 } });
  const cubeScale = interpolate(born, [0, 1], [0.35, 1]);
  const edges = interpolate(frame, [62, 86], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const glow = frame < IMPACT ? 0 : interpolate(frame, [IMPACT, IMPACT + 6, IMPACT + 30], [0, 2.2, 1], clamp);
  const flash = interpolate(frame, [IMPACT - 1, IMPACT + 1, IMPACT + 16], [0, 0.85, 0], clamp);
  const rays = interpolate(frame, [IMPACT + 4, IMPACT + 28], [0, 0.5], clamp);
  const bob = Math.sin(frame / 16) * 10;

  // zoom-through exit into scene 2
  const exitP = Easing.in(Easing.cubic)(interpolate(frame, [136, 165], [0, 1], clamp));
  const push = 1 + frame * 0.0007;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${push * (1 + exitP * 1.6)})`,
        transformOrigin: `${CX}px ${CY}px`,
        opacity: interpolate(frame, [148, 165], [1, 0], clamp),
        filter: exitP > 0 ? `blur(${exitP * 16}px)` : undefined,
      }}
    >
      {/* portal glow before the spark */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(109,209,187,${0.12 + 0.06 * Math.sin(frame / 8)}) 0%, transparent 32%)`,
        }}
      />

      {/* god rays */}
      <div
        style={{
          position: 'absolute',
          left: CX - 900,
          top: CY - 900,
          width: 1800,
          height: 1800,
          opacity: rays,
          background: `repeating-conic-gradient(from ${frame * 0.25}deg, rgba(255,231,200,0.22) 0deg 4deg, transparent 4deg 18deg)`,
          WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 55%)',
          maskImage: 'radial-gradient(circle, #000 0%, transparent 55%)',
        }}
      />

      {/* shockwaves */}
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {[0, 7, 14].map((d, i) => {
          const p = interpolate(frame, [IMPACT + d, IMPACT + d + 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          if (p <= 0 || p >= 1) return null;
          return (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={40 + p * (760 - i * 140)}
              fill="none"
              stroke={i === 1 ? C.secondary300 : C.accentLight}
              strokeWidth={(1 - p) * (10 - i * 2)}
              opacity={1 - p}
            />
          );
        })}
      </svg>

      <Motes seed="s1" count={46} colors={[C.accentLight, C.secondary300, C.mint]} opacity={interpolate(frame, [IMPACT, IMPACT + 30], [0.25, 1], clamp)} rise={1.1} />

      <Orbits frame={frame} front={false} />

      {frame >= IMPACT - 4 && (
        <div
          style={{
            position: 'absolute',
            left: CX - 125,
            top: CY - 140 + bob,
            transform: `scale(${cubeScale}) rotate(${(1 - born) * -25}deg)`,
          }}
        >
          <Cube id="s1-cube" size={250} assemble={born} edges={edges} glow={glow} />
        </div>
      )}

      <Orbits frame={frame} front />
      <Spark frame={frame} />

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,240,222,${flash}) 0%, rgba(242,154,74,${flash * 0.4}) 30%, transparent 70%)` }} />

      <div style={{ position: 'absolute', top: 740, width: W }}>
        <Words text="تجارتك تبدأ من هنا" start={82} size={96} color={C.background} glow="0 0 40px rgba(109,209,187,0.45)" exitAt={134} />
        <Words
          text="اكتشف المنتجات وجهّز طلبات عملائك في تجربة واحدة واضحة"
          start={102}
          stagger={2}
          size={36}
          weight={500}
          color={C.mint}
          exitAt={130}
          style={{ marginTop: 18 }}
        />
      </div>
    </AbsoluteFill>
  );
};
