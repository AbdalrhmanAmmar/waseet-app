import { SOURCE_WORDS, tokenAt } from './transcript';

// ─── edit ────────────────────────────────────────────────────────────────────

type Cut = { from: number; to: number }; // kept source range in frames [from, to)
type Placed = Cut & { at: number; len: number };

const place = (cuts: Cut[]): Placed[] => {
  let at = 0;
  return cuts.map((c) => {
    const p = { ...c, at, len: c.to - c.from };
    at += p.len;
    return p;
  });
};
const totalFrames = (placed: Placed[]) => placed.reduce((n, p) => n + p.len, 0);
/** Source seconds → timeline frame, snapping cut-out moments to the next kept frame. */
const tf = (placed: Placed[], sec: number) => {
  const f = sec * 30;
  const p = placed.find((c) => f < c.to);
  return Math.round(p ? p.at + Math.max(0, f - p.from) : totalFrames(placed));
};

// Source shots (frames @30fps, waseet.mp4):
//   0–169 talking head · 170–224 desk b-roll · 225–514 dashboard recording · 515–659 talking head (headphones)
//   660–675 desk b-roll · 676–984 phone recording · 985–1146 dashboard recording · 1147–1149 black (cut)
//   1150–1354 talking head · 1355–1434 desk b-roll · 1435–1528 phone recording · 1529–1980 desk b-roll
// The black frames sit inside a pause (38.21–38.43 s), so cutting them doesn't clip any speech.

export const CUTS: Cut[] = [
  { from: 0, to: 1147 },
  { from: 1150, to: 1981 },
];
export const PLACED = place(CUTS);
export const END = totalFrames(PLACED); // last frame of picture & voice
export const HOLD = 96; // freeze under the WhatsApp card
export const TOTAL = END + HOLD;

/** Timeline frame where whisper token i starts. */
export const w = (i: number) => tf(PLACED, tokenAt(i));
/** Timeline frame of a source second. */
export const s = (sec: number) => tf(PLACED, sec);

// Shot starts on the timeline (used for punch-ins and per-shot push).
export const SHOTS = [0, 170, 225, 515, 660, 676, 985, s(38.34), s(45.17), s(47.84), s(50.97), s(53.27), s(61.6)];

// ─── stages (motion takes over the screen-recording b-roll) ──────────────────
// Each stage starts 12 frames before its b-roll and ends 12 frames after, so the transitions run over
// the neighbouring talking-head/desk footage and never reveal the raw recording.
export const T = 12;
export const STAGES = [
  { from: 225 - T, to: 515 + T, enter: 'mask', exit: 'blur' },
  { from: 660 - T, to: s(38.34) + T, enter: 'slide', exit: 'iris' },
  { from: s(45.17) - T, to: s(61.6) + T, enter: 'blur', exit: 'mask' },
] as const;

export const inStage = (f: number) => STAGES.some((st) => f >= st.from + T && f < st.to - T);

// ─── captions ────────────────────────────────────────────────────────────────

export type Word = { text: string; key: boolean; start: number; end: number }; // timeline frames
export type CapPage = { start: number; end: number; words: Word[] };

const words = SOURCE_WORDS.map((x) => ({ text: x.text, key: x.key, br: x.br, start: tf(PLACED, x.start), end: tf(PLACED, x.end) }));
export const WORDS: Word[] = words;

/** Caption lines follow the hand-marked phrase breaks in transcript.ts (2–4 words each). */
export const PAGES: CapPage[] = (() => {
  const pages: CapPage[] = [];
  let cur: typeof words = [];
  for (const wd of words) {
    cur.push(wd);
    if (wd.br) {
      pages.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
      cur = [];
    }
  }
  if (cur.length) pages.push({ start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
  // hold each line until the next one starts (short gaps only)
  return pages.map((p, i) => ({ ...p, end: Math.min(pages[i + 1]?.start ?? p.end + 18, p.end + 18) }));
})();

export const CTA_AT = w(186) - 4; // «تواصل»
