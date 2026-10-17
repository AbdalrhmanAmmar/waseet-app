import { interpolate } from 'remotion';
import { sp } from './motion';
import { clamp, FONT, GLOW, KEY } from './theme';
import type { CapPage } from './timeline';

const LATIN = /[A-Za-z]/;
const clean = (t: string) => t.replace(/[.،:!?؟]+$/, '');

/**
 * Word-by-word Arabic captions on a soft translucent pill. The spoken word lights up in brand orange
 * with a very small pop; keywords stay mint; words not yet spoken sit slightly dimmer.
 */
export const Captions = ({ f, pages, y }: { f: number; pages: CapPage[]; y: number }) => {
  const page = pages.find((p) => f >= p.start && f < p.end);
  if (!page) return null;
  const inP = sp(f, page.start, 20, 0.6, 180);
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: y, display: 'flex', justifyContent: 'center', zIndex: 90 }}>
      <div
        style={{
          direction: 'rtl',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 16,
          rowGap: 0,
          maxWidth: 900,
          padding: '12px 34px 18px',
          borderRadius: 30,
          background: 'rgba(4,24,18,0.58)',
          boxShadow: '0 18px 44px rgba(0,0,0,0.28), inset 0 0 0 1.5px rgba(255,255,255,0.07)',
          transform: `translateY(${(1 - inP) * 14}px) scale(${0.94 + inP * 0.06})`,
          opacity: Math.min(1, inP * 1.8),
        }}
      >
        {page.words.map((w, i) => {
          const next = page.words[i + 1]?.start ?? page.end;
          const active = f >= w.start && f < next;
          const said = f >= w.start;
          const pop = active ? interpolate(f - w.start, [0, 3, 8], [0, 1, 0.55], clamp) : 0;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 64,
                lineHeight: 1.42,
                color: active ? GLOW : w.key ? KEY : '#FFFFFF',
                opacity: said ? 1 : 0.62,
                transform: `translateY(${-pop * 3}px) scale(${1 + pop * 0.06})`,
                textShadow: active ? '0 0 26px rgba(242,154,74,0.45), 0 3px 10px rgba(0,0,0,0.35)' : '0 3px 10px rgba(0,0,0,0.35)',
                direction: LATIN.test(w.text) ? 'ltr' : 'rtl',
                unicodeBidi: 'isolate',
              }}
            >
              {clean(w.text)}
            </span>
          );
        })}
      </div>
    </div>
  );
};
