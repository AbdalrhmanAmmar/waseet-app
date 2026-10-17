import type { ReactNode } from 'react';
import { C } from './theme';

export const SCREEN_W = 390;
export const SCREEN_H = 844;

/** Minimal modern phone frame. Screens are authored at 390×844 and scaled to `width`. */
export const Phone = ({ width, children }: { width: number; children: ReactNode }) => {
  const s = width / (SCREEN_W + 28);
  return (
    <div
      style={{
        width,
        height: (SCREEN_H + 28) * s,
        borderRadius: 64 * s,
        background: 'linear-gradient(145deg, #2B3B35, #0B1612 60%, #24332D)',
        padding: 14 * s,
        boxSizing: 'border-box',
        boxShadow: `0 ${60 * s}px ${120 * s}px rgba(0,0,0,0.45), inset 0 0 0 ${2 * s}px rgba(255,255,255,0.12)`,
        position: 'relative',
      }}
    >
      <div style={{ width: SCREEN_W * s, height: SCREEN_H * s, borderRadius: 50 * s, overflow: 'hidden', position: 'relative', background: C.background }}>
        <div style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${s})`, transformOrigin: '0 0', position: 'absolute' }}>{children}</div>
        <div
          style={{
            position: 'absolute',
            top: 11 * s,
            left: '50%',
            width: 120 * s,
            height: 34 * s,
            marginLeft: -60 * s,
            borderRadius: 20 * s,
            background: '#050807',
          }}
        />
      </div>
    </div>
  );
};

export const StatusBar = ({ dark = false }: { dark?: boolean }) => (
  <div
    style={{
      height: 54,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 30px 0',
      fontFamily: 'Tajawal',
      fontWeight: 700,
      fontSize: 16,
      color: dark ? '#fff' : C.ink,
      direction: 'ltr',
    }}
  >
    <span>9:41</span>
    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ width: 18, height: 10, borderRadius: 2, background: dark ? '#fff' : C.ink, opacity: 0.85 }} />
      <span style={{ width: 24, height: 12, borderRadius: 3, border: `1.5px solid ${dark ? '#fff' : C.ink}`, padding: 1.5, boxSizing: 'border-box' }}>
        <span style={{ display: 'block', width: '75%', height: '100%', borderRadius: 1, background: dark ? '#fff' : C.ink }} />
      </span>
    </span>
  </div>
);
