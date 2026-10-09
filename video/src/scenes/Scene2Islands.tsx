import {
  mdiAccountTieOutline,
  mdiChartBoxOutline,
  mdiCheckDecagram,
  mdiClipboardCheckOutline,
  mdiPackageVariantClosed,
  mdiShieldCheckOutline,
  mdiStorefrontOutline,
  mdiTruckFastOutline,
} from '@mdi/js';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Cube } from '../components/Cube';
import { Island, islandBob, type IslandSpec } from '../components/Island';
import { Motes } from '../components/Motes';
import { Words } from '../components/Text';
import { C, clamp, H, W } from '../theme';

// Journey runs right → left, like reading Arabic.
export const HOPS = [
  { start: 6, end: 24 },
  { start: 34, end: 60 },
  { start: 70, end: 96 },
  { start: 106, end: 132 },
];

const ISLANDS: IslandSpec[] = [
  { x: 1590, y: 690, scale: 1, icon: mdiStorefrontOutline, label: 'التاجر', status: { icon: mdiPackageVariantClosed, text: 'تم إنشاء الطلب' }, arrival: HOPS[0].end, seed: 1 },
  { x: 1170, y: 560, scale: 0.88, icon: mdiAccountTieOutline, label: 'موظف المبيعات', status: { icon: mdiClipboardCheckOutline, text: 'قيد التجهيز' }, arrival: HOPS[1].end, seed: 2 },
  { x: 760, y: 700, scale: 1, icon: mdiChartBoxOutline, label: 'الإدارة', status: { icon: mdiShieldCheckOutline, text: 'تمت الموافقة' }, arrival: HOPS[2].end, seed: 3 },
  { x: 340, y: 560, scale: 0.88, icon: mdiTruckFastOutline, label: 'مندوب التوصيل', status: { icon: mdiCheckDecagram, text: 'تم التوصيل' }, arrival: HOPS[3].end, seed: 4 },
];

const CUBE = 84;
const SKY_START = { x: 1500, y: -140 };

const anchor = (i: number, frame: number) => {
  const s = ISLANDS[i];
  return { x: s.x + 58 * s.scale, y: s.y + islandBob(frame, i) - 52 * s.scale };
};

const hopPath = (k: number, frame: number) => {
  const a = k === 0 ? SKY_START : anchor(k - 1, frame);
  const b = anchor(k, frame);
  const ctrl = k === 0 ? { x: 1640, y: 160 } : { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 230 };
  return { a, b, ctrl };
};

const quad = (p: number, a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (1 - p) ** 2 * a.x + 2 * (1 - p) * p * c.x + p ** 2 * b.x,
  y: (1 - p) ** 2 * a.y + 2 * (1 - p) * p * c.y + p ** 2 * b.y,
});

const hopProgress = (k: number, frame: number) =>
  Easing.inOut(Easing.cubic)(interpolate(frame, [HOPS[k].start, HOPS[k].end], [0, 1], clamp));

const cubeAt = (frame: number) => {
  let k = HOPS.findIndex((h) => frame < h.end);
  if (k === -1) return { ...anchor(HOPS.length - 1, frame), hopping: false, k: HOPS.length - 1, p: 1 };
  if (frame < HOPS[k].start) {
    if (k === 0) return null;
    return { ...anchor(k - 1, frame), hopping: false, k: k - 1, p: 1 };
  }
  const p = hopProgress(k, frame);
  const { a, b, ctrl } = hopPath(k, frame);
  return { ...quad(p, a, ctrl, b), hopping: true, k, p };
};

const Routes = ({ frame }: { frame: number }) => (
  <svg width={W} height={H} style={{ position: 'absolute', overflow: 'visible' }}>
    {HOPS.slice(1).map((_, i) => {
      const k = i + 1;
      const p = hopProgress(k, frame);
      if (p <= 0) return null;
      const { a, b, ctrl } = hopPath(k, frame);
      const d = `M${a.x} ${a.y} Q${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`;
      return (
        <g key={k}>
          <path d={d} fill="none" stroke={C.secondary} strokeWidth={18} strokeOpacity={0.18} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
          <path d={d} fill="none" stroke={C.mint} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} opacity={0.9} />
          {p >= 1 && (
            <path d={d} fill="none" stroke={C.accentLight} strokeWidth={5} strokeLinecap="round" strokeDasharray="0.1 30" strokeDashoffset={frame * 2} />
          )}
        </g>
      );
    })}
  </svg>
);

const TravellingCube = ({ frame }: { frame: number }) => {
  const { fps } = useVideoConfig();
  const pos = cubeAt(frame);
  if (!pos) return null;
  const landed = HOPS.filter((h) => frame >= h.end).at(-1);
  const squash = landed ? spring({ frame: frame - landed.end, fps, config: { damping: 7, stiffness: 180 } }) : 1;
  const sy = 1 - (1 - squash) * 0.28;
  const sx = 1 + (1 - squash) * 0.18;
  const tilt = pos.hopping ? Math.sin(pos.p * Math.PI) * -16 : 0;
  const hover = pos.hopping ? 0 : Math.sin(frame / 10) * 4;
  return (
    <>
      {pos.hopping &&
        Array.from({ length: 12 }, (_, j) => {
          const g = cubeAt(frame - (j + 1) * 0.9);
          if (!g || !g.hopping) return null;
          const s = 22 - j * 1.4;
          return (
            <div
              key={j}
              style={{
                position: 'absolute',
                left: g.x - s / 2,
                top: g.y - s / 2,
                width: s,
                height: s,
                borderRadius: '50%',
                opacity: 0.8 - j * 0.06,
                background: `radial-gradient(circle, #fff 0%, ${j % 2 ? C.secondary300 : C.accentLight} 35%, transparent 70%)`,
              }}
            />
          );
        })}
      <div
        style={{
          position: 'absolute',
          left: pos.x - CUBE / 2,
          top: pos.y - CUBE * 0.55 + hover,
          transform: `rotate(${tilt}deg) scale(${sx}, ${sy})`,
          transformOrigin: '50% 100%',
        }}
      >
        <Cube id="s2-cube" size={CUBE} glow={pos.hopping ? 1.4 : 1} />
      </div>
    </>
  );
};

export const Scene2Islands = () => {
  const frame = useCurrentFrame();
  const enter = Easing.out(Easing.cubic)(interpolate(frame, [0, 22], [0, 1], clamp));
  const exit = Easing.in(Easing.cubic)(interpolate(frame, [148, 165], [0, 1], clamp));
  const camX = interpolate(frame, [0, 165], [-110, 110], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const camScale = (0.82 + enter * 0.18) * (1 - exit * 0.18);

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enter * 1.4, 1 - exit),
        filter: enter < 1 || exit > 0 ? `blur(${(1 - enter) * 14 + exit * 12}px)` : undefined,
      }}
    >
      <Motes seed="s2" count={34} colors={[C.secondary300, C.mint, C.accentLight]} rise={0.7} opacity={0.8} />
      <AbsoluteFill style={{ transform: `translateX(${camX}px) scale(${camScale})`, transformOrigin: '50% 60%' }}>
        <Routes frame={frame} />
        {ISLANDS.map((s, i) => (
          <Island key={i} spec={s} index={i} />
        ))}
        <TravellingCube frame={frame} />
      </AbsoluteFill>
      <div style={{ position: 'absolute', top: 70, width: W }}>
        <Words text="كل طلب، خطوة بخطوة" start={8} size={80} color={C.background} glow="0 0 36px rgba(109,209,187,0.4)" exitAt={146} />
        <Words
          text="تابع تفاصيل الطلب وتحديثات حالته، من الإنشاء وحتى التوصيل"
          start={22}
          stagger={2}
          size={34}
          weight={500}
          color={C.mint}
          exitAt={144}
          style={{ marginTop: 10 }}
        />
      </div>
    </AbsoluteFill>
  );
};
