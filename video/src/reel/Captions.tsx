import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, CAPTION_FONT, clamp } from './theme';

export type Word = { text: string; start: number; end: number }; // timeline seconds
export type Page = { start: number; end: number; words: Word[] };

const MAX_WORDS = 4;
const MAX_CHARS = 22;
const GAP_BREAK = 0.45;

/** Group words into short caption pages (≤4 words, break on pauses). */
export const paginate = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
    cur = [];
  };
  for (const w of words) {
    const prev = cur.at(-1);
    const chars = cur.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    if (prev && (cur.length >= MAX_WORDS || chars > MAX_CHARS || w.start - prev.end > GAP_BREAK)) flush();
    cur.push(w);
    if (/[.!?؟،]$/.test(w.text)) flush();
  }
  flush();
  // keep each page on screen until the next one starts (short gaps only)
  return pages.map((p, i) => ({ ...p, end: Math.min(pages[i + 1]?.start ?? p.end + 0.6, p.end + 0.6) }));
};

/** Word-by-word Arabic captions: white words on a deep-green glass pill, the spoken word lights up orange. */
export const Captions = ({ pages, y = 1330, hidden }: { pages: Page[]; y?: number; hidden?: (t: number) => boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const page = pages.find((p) => t >= p.start && t < p.end);
  if (!page || hidden?.(t)) return null;
  const inP = spring({ frame: frame - Math.round(page.start * fps), fps, config: { damping: 14, mass: 0.6 } });

  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: y, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          direction: 'rtl',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 18,
          rowGap: 4,
          padding: '20px 38px 26px',
          borderRadius: 36,
          background: 'rgba(10,38,30,0.74)',
          border: '2px solid rgba(198,231,219,0.22)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(14px)',
          transform: `translateY(${(1 - inP) * 40}px) scale(${0.86 + inP * 0.14})`,
          opacity: Math.min(1, inP * 1.6),
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start && t < (page.words[i + 1]?.start ?? page.end);
          const said = t >= w.start;
          const k = interpolate(t, [w.start, w.start + 0.12], [0, 1], clamp);
          return (
            <span
              key={i}
              style={{
                fontFamily: CAPTION_FONT,
                fontWeight: 800,
                fontSize: 68,
                lineHeight: 1.35,
                color: active ? C.accent : '#FFFFFF',
                opacity: said ? 1 : 0.55,
                transform: `scale(${active ? 1 + 0.08 * k : 1})`,
                textShadow: active ? '0 0 28px rgba(242,154,74,0.55)' : '0 3px 12px rgba(0,0,0,0.35)',
                display: 'inline-block',
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
