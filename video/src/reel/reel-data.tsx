import { mdiAccountGroupOutline, mdiBullhornOutline, mdiCashPlus } from '@mdi/js';
import type { ReactNode } from 'react';
import raw from './data/whisper-words.json';
import { paginate } from './Captions';
import { place, srcToTimeline, tf, totalFrames, type Cut } from './edit';
import { AllInOneInsert, AppInsert, CompareInsert, DashInsert, PricingInsert, RolesInsert, ShippingInsert, WalletInsert, ZonesCard } from './inserts';
import { Callout, StageEdges } from './Stage';
import { SOURCE_WORDS } from './transcript';
import { TYPE_FRAMES_PER_CHAR, TYPE_START, CONTACT } from './WhatsAppCard';

// ─── edit ────────────────────────────────────────────────────────────────────
// Source shots (frames @30fps): 0–175 talking head · 176–180 black · 181–514 b-roll ·
// 515–659 talking head · 660–1147 desk b-roll · 1148–1149 black · 1150–1354 talking head · 1355–1980 b-roll

export const CUTS: Cut[] = [
  { from: 0, to: 109 },
  { from: 109, to: 176, zoom: 1.14 }, // punch-in on "خلّي التجار يبيعوهالك"
  { from: 181, to: 1148 },
  { from: 1150, to: 1273 },
  { from: 1273, to: 1981, zoom: 1.12 }, // punch-in on "وفي مناطق تانية"
];
export const PLACED = place(CUTS);
export const HOLD = 96; // freeze on the last frame under the WhatsApp card
export const TOTAL = totalFrames(PLACED) + HOLD;

const tokens = raw as { startMs: number }[];
/** Timeline frame of whisper token `i` (see transcript.ts for indices). */
const w = (i: number) => tf(PLACED, tokens[i].startMs / 1000);
/** Timeline frame of a source second. */
const s = (sec: number) => tf(PLACED, sec);

// ─── captions ────────────────────────────────────────────────────────────────

export const PAGES = paginate(
  SOURCE_WORDS.flatMap((x) => {
    const start = srcToTimeline(PLACED, x.start);
    const end = srcToTimeline(PLACED, x.end) ?? srcToTimeline(PLACED, x.end - 0.2);
    return start === null || end === null ? [] : [{ text: x.text, start, end }];
  }),
);

// ─── inserts (full-screen motion over b-roll) ────────────────────────────────

type Block = { name: string; at: number; len: number; render: (len: number) => ReactNode };

const block = (name: string, from: number, to: number, render: (len: number, rel: (f: number) => number) => ReactNode): Block => ({
  name,
  at: from,
  len: to - from,
  render: (len) => render(len, (f) => f - from),
});

const stages: Block[] = [
  block('3 prices', s(6.04), s(17.17), (len, r) => (
    <PricingInsert len={len} cue={{ client: r(w(26)), admin: r(w(29)), p1: r(w(35)), p2: r(w(42)), p3: r(w(50)) }} />
  )),
  block('4 roles', s(22.0), w(87), (len, r) => (
    <RolesInsert len={len} cue={{ roles: [w(74), w(75), w(77), w(78)].map(r), join: r(w(80)), approve: r(w(85)) }} />
  )),
  block('merchant app', w(87), w(97), (len, r) => <AppInsert len={len} cue={{ products: r(w(90)), pick: r(w(91) + 8), create: r(w(92)) }} />),
  block('dashboard', w(97), w(104), (len, r) => <DashInsert len={len} cue={{ delivered: r(w(103)) }} />),
  block('shipping', w(104), s(38.27), (len, r) => <ShippingInsert len={len} cue={{ link: r(w(107)) }} />),
  block('wallet', s(45.17), w(156), (len, r) => (
    <WalletInsert len={len} cue={{ credit: r(w(142)), request: r(w(148)), review: r(w(151)), approve: r(w(154)) }} />
  )),
  block('all in one', w(156), w(170), (len, r) => <AllInOneInsert len={len} cue={{ items: [157, 158, 159, 160, 161].map((i) => r(w(i))), one: r(w(163)) }} />),
  block('compare', w(170), w(178), (len, r) => <CompareInsert len={len} cue={{ store: r(w(170)) + 2, system: r(w(174)), grow: r(w(176)) }} />),
];

export const INSERTS: Block[] = stages.map((b, i) => {
  const enter = !(i > 0 && stages[i - 1].at + stages[i - 1].len >= b.at);
  const exit = !(stages[i + 1] && b.at + b.len >= stages[i + 1].at);
  return { ...b, render: (len) => <StageEdges.Provider value={{ enter, exit }}>{b.render(len)}</StageEdges.Provider> };
});

// ─── overlays on talking-head / footage moments ──────────────────────────────

export const OVERLAYS: Block[] = [
  block('no ads', w(12), s(5.86), (len) => <Callout icon={mdiBullhornOutline} title="من غير مصاريف إعلانات" x={170} y={930} at={0} until={len} width={740} />),
  block('commission', w(62), s(22.0), (len) => <Callout icon={mdiCashPlus} title="التاجر بيحدد سعر البيع" sub="والفرق عمولته" x={190} y={920} at={0} until={len} accent width={700} />),
  block('zones', s(38.34), s(45.17), (len, r) => <ZonesCard len={len} cue={{ a: r(w(114)), b: r(w(125)) }} />),
  block('want merchants', w(182), w(188), (len) => <Callout icon={mdiAccountGroupOutline} title="عايز تجار يبيعولك؟" x={190} y={920} at={0} until={len} width={700} />),
];

// ─── WhatsApp end card ───────────────────────────────────────────────────────

export const CTA = { at: w(188) };

// ─── sound design ────────────────────────────────────────────────────────────

type Cue = { at: number; src: string; volume: number };
const cue = (at: number, src: string, volume: number): Cue => ({ at: Math.round(at), src, volume });

const stageCues = INSERTS.flatMap((b, i) => (i > 0 && stages[i - 1].at + stages[i - 1].len >= b.at ? [cue(b.at - 4, 'whoosh-1', 0.16)] : [cue(b.at - 6, 'whoosh-3', 0.24)]));
const typing = (from: number, to: number, every: number, volume: number) =>
  Array.from({ length: Math.max(0, Math.floor((to - from) / every)) }, (_, k) => cue(from + k * every, k % 2 ? 'tick-2' : 'tick-1', volume));

const createAt = w(92);
export const CUES: Cue[] = [
  ...stageCues,
  // hook
  cue(w(12), 'pop', 0.22),
  cue(w(14), 'whoosh-3', 0.14),
  // 3 prices
  cue(w(26), 'pop', 0.2),
  cue(w(29), 'whoosh-1', 0.14),
  ...[35, 42, 50].map((i) => cue(w(i), 'tick-1', 0.35)),
  cue(w(50) + 24, 'coin', 0.3),
  // commission
  cue(w(62), 'pop', 0.22),
  // roles
  ...[74, 75, 77, 78].map((i, k) => cue(w(i), `chime-${k + 1}`, 0.16)),
  cue(w(80), 'pop', 0.22),
  cue(w(85), 'coin', 0.26),
  // merchant app
  cue(w(91) + 8, 'tick-2', 0.35),
  ...typing(createAt + 4, createAt + 48, 3, 0.07),
  cue(createAt + 58, 'chime-3', 0.28),
  // dashboard → delivered
  cue(w(103), 'chime-4', 0.26),
  // shipping link + zones
  cue(w(107) + 4, 'whoosh-1', 0.2),
  cue(w(107) + 22, 'pop', 0.2),
  cue(w(114), 'pop', 0.2),
  cue(w(125), 'pop', 0.2),
  // wallet
  cue(w(142) - 16, 'ding', 0.3),
  cue(w(142), 'coin', 0.32),
  cue(w(148), 'tick-1', 0.35),
  cue(w(151), 'whoosh-3', 0.18),
  cue(w(154) + 4, 'chime-4', 0.26),
  // all in one place → logo
  ...[157, 158, 159, 160, 161].map((i) => cue(w(i), 'pop', 0.18)),
  cue(w(163), 'whoosh-2', 0.2),
  cue(w(163) + 10, 'shimmer', 0.3),
  // compare
  cue(w(174), 'pop', 0.2),
  cue(w(176), 'coin', 0.26),
  // final ask + WhatsApp card
  cue(w(182), 'pop', 0.22),
  cue(CTA.at - 4, 'whoosh-2', 0.32),
  cue(CTA.at + 8, 'ding', 0.34),
  ...Array.from({ length: CONTACT.phone.length }, (_, k) => cue(CTA.at + TYPE_START + k * TYPE_FRAMES_PER_CHAR, k % 2 ? 'tick-2' : 'tick-1', 0.12)),
  cue(CTA.at + TYPE_START + CONTACT.phone.length * TYPE_FRAMES_PER_CHAR + 4, 'pop', 0.3),
  cue(CTA.at + TYPE_START + CONTACT.phone.length * TYPE_FRAMES_PER_CHAR + 6, 'shimmer-soft', 0.3),
];
