import type { CSSProperties, ReactNode } from 'react';
import { interpolate } from 'remotion';
import { Icon } from '../components/Text';
import { float, type FocusKey, focus as focusAt, lerp, type PointerKey, pointer, sp } from './motion';
import { C, clamp, FONT, GLOW, UH, UW } from './theme';

// ─── backdrop ───────────────────────────────────────────────────────────────

/** Calm brand gradient with very slow drifting light — the stage behind every device. */
export const Backdrop = ({ f }: { f: number }) => {
  const a = f / 300;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(170deg, #0B3A2E 0%, #072A21 48%, #051E18 100%)' }}>
      <div
        style={{
          position: 'absolute',
          width: 1500,
          height: 1500,
          left: -380 + Math.sin(a) * 60,
          top: -520 + Math.cos(a * 0.8) * 50,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(61,191,163,0.30), rgba(61,191,163,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          right: -560 + Math.cos(a * 0.9) * 70,
          top: 820 + Math.sin(a * 1.1) * 60,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(242,154,74,0.16), rgba(242,154,74,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          left: -300 + Math.sin(a * 0.7 + 2) * 50,
          top: 1250,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(20,125,100,0.32), rgba(20,125,100,0) 70%)',
        }}
      />
      {/* soft light sweep */}
      <div
        style={{
          position: 'absolute',
          inset: -400,
          background: 'linear-gradient(115deg, transparent 40%, rgba(198,231,219,0.05) 50%, transparent 60%)',
          transform: `translateX(${Math.sin(a * 0.6) * 160}px)`,
        }}
      />
      {/* fine dot grid fading out from the centre */}
      <svg width={UW} height={UH} style={{ position: 'absolute', inset: 0, opacity: 0.22 }}>
        <defs>
          <pattern id="bd-dots" width={36} height={36} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${(f * 0.25) % 36})`}>
            <circle cx={18} cy={18} r={1.3} fill="#C6E7DB" />
          </pattern>
          <radialGradient id="bd-fade" cx="50%" cy="42%" r="60%">
            <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="bd-mask">
            <rect width={UW} height={UH} fill="url(#bd-fade)" />
          </mask>
        </defs>
        <rect width={UW} height={UH} fill="url(#bd-dots)" mask="url(#bd-mask)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(2,14,10,0.55) 100%)' }} />
    </div>
  );
};

// ─── devices ────────────────────────────────────────────────────────────────

export const PHONE = { w: 390, h: 844 };

/** Slim modern phone: thin titanium rim, dynamic island, glass glare. Content authored at 390×844. */
export const PhoneFrame = ({ children, scale }: { children: ReactNode; scale: number }) => {
  const b = 11; // bezel
  return (
    <div
      style={{
        width: PHONE.w + b * 2,
        height: PHONE.h + b * 2,
        borderRadius: 62,
        padding: b,
        boxSizing: 'border-box',
        position: 'relative',
        background: 'linear-gradient(150deg, #3A4A44 0%, #11201B 30%, #0A1512 70%, #33433D 100%)',
        boxShadow: [
          'inset 0 0 0 1.5px rgba(255,255,255,0.22)',
          'inset 0 0 0 4px #0A1210',
          `0 ${40 / scale}px ${90 / scale}px -${10 / scale}px rgba(0,0,0,0.55)`,
          `0 ${12 / scale}px ${30 / scale}px rgba(0,0,0,0.25)`,
        ].join(','),
      }}
    >
      {/* side keys */}
      <div style={{ position: 'absolute', left: -3, top: 170, width: 3, height: 62, borderRadius: 2, background: '#2A3833' }} />
      <div style={{ position: 'absolute', left: -3, top: 250, width: 3, height: 62, borderRadius: 2, background: '#2A3833' }} />
      <div style={{ position: 'absolute', right: -3, top: 210, width: 3, height: 96, borderRadius: 2, background: '#2A3833' }} />
      <div style={{ width: PHONE.w, height: PHONE.h, borderRadius: 52, overflow: 'hidden', position: 'relative', background: C.background }}>
        {children}
        <div style={{ position: 'absolute', top: 11, left: '50%', width: 118, height: 34, marginLeft: -59, borderRadius: 20, background: '#030605' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 100%)' }} />
      </div>
    </div>
  );
};

export const BROWSER = { w: 760, h: 1010, bar: 52 };

/** Clean browser window (light chrome) for the dashboard. Content authored at 760×(1010-bar). */
export const BrowserFrame = ({ children, scale, title = 'الوسيط الذكي · لوحة التحكم' }: { children: ReactNode; scale: number; title?: string }) => (
  <div
    style={{
      width: BROWSER.w,
      height: BROWSER.h,
      borderRadius: 22,
      overflow: 'hidden',
      position: 'relative',
      background: '#fff',
      boxShadow: [
        'inset 0 0 0 1px rgba(16,62,50,0.10)',
        `0 ${40 / scale}px ${90 / scale}px -${10 / scale}px rgba(0,0,0,0.55)`,
        `0 ${12 / scale}px ${30 / scale}px rgba(0,0,0,0.25)`,
      ].join(','),
    }}
  >
    <div style={{ height: BROWSER.bar, background: '#EEF3F0', borderBottom: '1px solid #DCE6E0', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14, direction: 'ltr' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['#FF6159', '#FFBD2E', '#29C941'].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85 }} />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          height: 32,
          borderRadius: 10,
          background: '#fff',
          border: '1px solid #DCE6E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 500,
          color: '#4B5E56',
          direction: 'rtl',
        }}
      >
        <svg width={12} height={14} viewBox="0 0 12 14">
          <rect x={1} y={6} width={10} height={8} rx={2} fill="#7B8D85" />
          <path d="M3.5 6V4.2a2.5 2.5 0 0 1 5 0V6" stroke="#7B8D85" strokeWidth={1.6} fill="none" />
        </svg>
        {title}
      </div>
      <div style={{ width: 52 }} />
    </div>
    <div style={{ position: 'absolute', top: BROWSER.bar, left: 0, width: BROWSER.w, height: BROWSER.h - BROWSER.bar, overflow: 'hidden', background: '#F4F7F5' }}>{children}</div>
  </div>
);

// ─── rig: 3D entrance + float + camera ──────────────────────────────────────

/**
 * Places a device on the stage. Enters with a soft spring tilt + scale, then floats. The camera
 * (s, x, y) zooms toward a device point; float and tilt fade out while zoomed so the UI stays legible.
 */
export const Rig = ({
  f,
  enterAt = 0,
  cam,
  cx = UW / 2,
  cy = 820,
  scale,
  size,
  children,
  exit,
  from = 'below',
}: {
  f: number;
  /** device frame size in its own px (the rig centres it on (cx, cy)) */
  size: { w: number; h: number };
  enterAt?: number;
  cam: { s: number; x: number; y: number };
  cx?: number;
  cy?: number;
  scale: number;
  children: ReactNode;
  /** 0..1 exit progress with a direction */
  exit?: { p: number; dir: 'left' | 'right' | 'down' | 'shrink' };
  from?: 'below' | 'left' | 'right';
}) => {
  const e = sp(f, enterAt, 20, 1, 90);
  const zoomed = Math.min(1, Math.max(0, (cam.s - 1) / 0.35));
  const fl = float(f, 1 - zoomed * 0.85);
  const enterTilt = 1 - e;
  const rx = 16 * enterTilt + fl.rx + 3 * (1 - zoomed);
  const ry = (from === 'left' ? 24 : from === 'right' ? -24 : -14) * enterTilt + fl.ry - 4 * (1 - zoomed);
  const tx = (from === 'left' ? -420 : from === 'right' ? 420 : 0) * enterTilt;
  const ty = (from === 'below' ? 260 : 40) * enterTilt + fl.y;
  const s = scale * (0.86 + 0.14 * e) * cam.s;
  let xo = 0;
  let yo = 0;
  let so = 1;
  let oo = 1;
  if (exit && exit.p > 0) {
    if (exit.dir === 'left') xo = -900 * exit.p;
    if (exit.dir === 'right') xo = 900 * exit.p;
    if (exit.dir === 'down') yo = 900 * exit.p;
    if (exit.dir === 'shrink') {
      so = 1 - 0.75 * exit.p;
      oo = 1 - exit.p;
    }
  }
  return (
    <div style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0, perspective: 2600, opacity: Math.min(1, e * 2) * oo }}>
      {/* floor shadow */}
      <div
        style={{
          position: 'absolute',
          left: -360,
          top: 600,
          width: 720,
          height: 90,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.42), transparent)',
          opacity: (1 - zoomed) * e * (1 - (exit?.p ?? 0)),
          transform: `translateY(${fl.y * 0.4}px) scaleX(${1 - fl.y * 0.004})`,
          filter: 'blur(6px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: `translate(${tx + xo}px, ${ty + yo}px) scale(${s * so}) rotateX(${rx}deg) rotateY(${ry}deg) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        <div style={{ position: 'absolute', left: -size.w / 2, top: -size.h / 2, width: size.w, height: size.h }}>{children}</div>
      </div>
    </div>
  );
};

// ─── focus highlight + pointer (inside device content coords) ───────────────

export const Focus = ({ f, keys, dim = 0.42 }: { f: number; keys: FocusKey[]; dim?: number }) => {
  const k = focusAt(f, keys);
  if (!k || k.on <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin(f / 7);
  return (
    <div
      style={{
        position: 'absolute',
        left: k.x - 6,
        top: k.y - 6,
        width: k.w + 12,
        height: k.h + 12,
        borderRadius: k.r + 6,
        pointerEvents: 'none',
        boxShadow: [
          `0 0 0 2.5px rgba(242,154,74,${k.on})`,
          `0 0 ${22 + pulse * 8}px ${4 + pulse * 2}px rgba(242,154,74,${0.38 * k.on})`,
          `0 0 0 3000px rgba(7,30,24,${dim * k.on})`,
        ].join(','),
        zIndex: 40,
      }}
    />
  );
};

/** Finger tap (phone): soft dot that presses down, then a ripple. */
export const Taps = ({ f, keys }: { f: number; keys: PointerKey[] }) => {
  const live = keys.find((k) => f >= k.at - 10 && f < k.at + 16);
  if (!live) return null;
  const t = f - live.at;
  const appear = interpolate(t, [-10, -4], [0, 1], clamp) * interpolate(t, [6, 14], [1, 0], clamp);
  const down = interpolate(t, [-4, 0, 4], [1, 0.82, 1], clamp);
  const ripple = interpolate(t, [0, 16], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: live.x, top: live.y, zIndex: 60, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: -48 * (0.4 + ripple * 0.9),
          top: -48 * (0.4 + ripple * 0.9),
          width: 96 * (0.4 + ripple * 0.9),
          height: 96 * (0.4 + ripple * 0.9),
          borderRadius: '50%',
          border: `2.5px solid rgba(255,255,255,${0.9 * (1 - ripple)})`,
          background: `rgba(242,154,74,${0.18 * (1 - ripple)})`,
          opacity: t >= 0 ? 1 : 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -22,
          top: -22,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.55)',
          border: '2px solid rgba(255,255,255,0.9)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          opacity: appear,
          transform: `scale(${down})`,
        }}
      />
    </div>
  );
};

/** Mouse cursor (browser) that glides along an arc and clicks with a ripple. */
export const Cursor = ({ f, keys, from = 0 }: { f: number; keys: PointerKey[]; from?: number }) => {
  if (f < from) return null;
  const { x, y, clicks } = pointer(f, keys);
  const appear = interpolate(f, [from, from + 8], [0, 1], clamp);
  const c = clicks.find((at) => f >= at - 3 && f < at + 16);
  const down = c === undefined ? 1 : interpolate(f - c, [-3, 0, 4], [1, 0.84, 1], clamp);
  const ripple = c === undefined ? 0 : interpolate(f - c, [0, 16], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 60, pointerEvents: 'none', opacity: appear }}>
      {c !== undefined && f >= c && (
        <div
          style={{
            position: 'absolute',
            left: -40 * ripple - 6,
            top: -40 * ripple - 6,
            width: 80 * ripple + 12,
            height: 80 * ripple + 12,
            borderRadius: '50%',
            border: `2.5px solid rgba(242,154,74,${1 - ripple})`,
            background: `rgba(242,154,74,${0.16 * (1 - ripple)})`,
          }}
        />
      )}
      <svg width={30} height={36} viewBox="0 0 30 36" style={{ position: 'absolute', left: -3, top: -2, transform: `scale(${down})`, transformOrigin: '3px 2px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))' }}>
        <path d="M3 2 L3 28 L10 21.5 L14.5 32 L19 30 L14.6 19.8 L24 19.8 Z" fill="#111A17" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ─── callouts ───────────────────────────────────────────────────────────────

/** Small premium label for a feature name: glass chip with icon, springs in, floats, fades out. */
export const Callout = ({
  f,
  at,
  until,
  x,
  y,
  icon,
  title,
  sub,
  tone = 'light',
  align = 'center',
  style,
}: {
  f: number;
  at: number;
  until: number;
  x: number;
  y: number;
  icon: string;
  title: string;
  sub?: string;
  tone?: 'light' | 'accent' | 'dark';
  align?: 'center' | 'left' | 'right';
  style?: CSSProperties;
}) => {
  if (f < at - 1 || f > until + 12) return null;
  const p = sp(f, at, 15, 0.7, 140);
  const out = interpolate(f, [until, until + 10], [0, 1], clamp);
  const bg = tone === 'accent' ? `linear-gradient(135deg, ${GLOW}, #E2823A)` : tone === 'dark' ? 'rgba(10,40,31,0.92)' : 'rgba(255,255,255,0.97)';
  const fg = tone === 'light' ? C.ink : '#fff';
  const tile = tone === 'light' ? C.soft : 'rgba(255,255,255,0.18)';
  const ic = tone === 'light' ? C.primary : '#fff';
  const tx = align === 'center' ? '-50%' : align === 'left' ? '0%' : '-100%';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 70,
        transform: `translate(${tx}, ${(1 - p) * 34 - out * 16 + Math.sin((f - at) / 22) * 4}px) scale(${lerp(0.82, 1, p)})`,
        opacity: Math.min(1, p * 1.6) * (1 - out),
        filter: out > 0 ? `blur(${out * 6}px)` : undefined,
        ...style,
      }}
    >
      <div
        style={{
          direction: 'rtl',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: sub ? '14px 22px 14px 16px' : '12px 24px 12px 14px',
          borderRadius: 26,
          background: bg,
          border: tone === 'dark' ? '1.5px solid rgba(198,231,219,0.22)' : undefined,
          boxShadow: '0 22px 50px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 16, background: tile, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon path={icon} size={30} color={ic} />
        </div>
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 31, lineHeight: 1.2, color: fg }}>{title}</div>
          {sub && <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 22, lineHeight: 1.3, color: tone === 'light' ? C.muted : 'rgba(255,255,255,0.85)' }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
};

// ─── screen paging inside a device ──────────────────────────────────────────

export type Page = { at: number; el: ReactNode; kind?: 'push' | 'back' | 'fade' | 'up' };

/** Shows one page at a time with an eased push (RTL: new page enters from the left) / back / fade / sheet-up. */
export const Pages = ({ f, pages, width }: { f: number; pages: Page[]; width: number }) => (
  <>
    {pages.map((pg, i) => {
      const next = pages[i + 1];
      if (f < pg.at - 1 && i > 0) return null;
      if (next && f >= next.at + 14) return null;
      const kind = pg.kind ?? 'push';
      const inP = i === 0 ? 1 : interpolate(f, [pg.at, pg.at + 14], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
      const outP = next ? interpolate(f, [next.at, next.at + 14], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 }) : 0;
      const nk = next?.kind ?? 'push';
      let tf = '';
      let op = 1;
      let fl: string | undefined;
      if (kind === 'push') tf += `translateX(${(1 - inP) * -width}px) `;
      if (kind === 'back') tf += `translateX(${(1 - inP) * -0.25 * width}px) `;
      if (kind === 'fade') {
        op *= inP;
        tf += `scale(${lerp(0.97, 1, inP)}) `;
      }
      if (kind === 'up') tf += `translateY(${(1 - inP) * 110}%) `;
      if (outP > 0) {
        if (nk === 'push') {
          tf += `translateX(${outP * 0.28 * width}px) `;
          fl = `brightness(${1 - outP * 0.25})`;
        }
        if (nk === 'back') tf += `translateX(${outP * width}px) `;
        if (nk === 'fade') op *= 1 - outP;
      }
      return (
        <div key={i} style={{ position: 'absolute', inset: 0, transform: tf || undefined, opacity: op, filter: fl, zIndex: i, boxShadow: kind === 'push' && inP < 1 ? '20px 0 40px rgba(0,0,0,0.12)' : undefined }}>
          {pg.el}
        </div>
      );
    })}
  </>
);
