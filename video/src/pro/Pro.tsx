import { Audio } from '@remotion/media';
import type { ReactNode } from 'react';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { TYPE_FRAMES_PER_CHAR, TYPE_START, CONTACT, WhatsAppCard } from '../reel/WhatsAppCard';
import { Captions } from './Captions';
import { Backdrop } from './kit';
import { lerp, prog } from './motion';
import { AllInOne, AppScene1, AppScene2, AskCard, Compare, DashScene1, DashScene2, PriceFormula, TalkCallouts, ZoneChips } from './scenes';
import { clamp, IN, OUT, RW, UH, UW } from './theme';
import { CTA_AT, END, PAGES, PLACED, SHOTS, STAGES, T, TOTAL, w } from './timeline';

const GRADE = 'contrast(1.05) saturate(1.06) brightness(1.02)';

// ─── footage ─────────────────────────────────────────────────────────────────

/** Smooth punch-ins on sentence starts inside talking-head shots, plus a slow push on every shot. */
const PUNCH = [
  { at: w(13), shot: 0, z: 1.1 }, // «خلّي التجار يبيعوهالك»
  { at: w(62), shot: 515, z: 1.1 }, // «هو يزود…»
  { at: w(123), shot: SHOTS[7], z: 1.09 }, // «وفي مناطق تانية…»
];
const zoomAt = (f: number) => {
  const shot = [...SHOTS].reverse().find((s) => f >= s) ?? 0;
  const punch = PUNCH.find((p) => p.shot === shot && f >= p.at - 5);
  const z = punch ? lerp(1, punch.z, prog(f, punch.at - 5, punch.at + 1)) : 1;
  return z + Math.min(f - shot, 300) * 0.00012;
};

const Footage = ({ f }: { f: number }) => {
  const blur = interpolate(f, [CTA_AT, CTA_AT + 16], [0, 16], clamp);
  return (
    <AbsoluteFill style={{ filter: blur ? `blur(${blur}px) brightness(${1 - blur * 0.012})` : undefined }}>
      {PLACED.map((c, i) => (
        <Sequence key={i} from={c.at} durationInFrames={c.len} name={`footage ${i + 1}`}>
          <AbsoluteFill style={{ transform: `scale(${zoomAt(f)})`, transformOrigin: '50% 36%' }}>
            <OffthreadVideo src={staticFile('footage/waseet-pro.mp4')} trimBefore={c.from} muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: GRADE }} />
          </AbsoluteFill>
        </Sequence>
      ))}
      <Sequence from={END} name="hold">
        <AbsoluteFill style={{ transform: `scale(${zoomAt(END - 1) + (f - END) * 0.0004})`, transformOrigin: '50% 36%' }}>
          <Img src={staticFile('footage/pro/last-frame.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: GRADE }} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// ─── stages ──────────────────────────────────────────────────────────────────

type Kind = 'mask' | 'slide' | 'blur' | 'iris';

/** Eased 0.4 s transitions between footage and the brand stage — never linear, never a flash. */
const StageShell = ({ f, from, to, enter, exit, children }: { f: number; from: number; to: number; enter: Kind; exit: Kind; children: ReactNode }) => {
  if (f < from || f >= to) return null;
  const a = prog(f, from, from + T, OUT);
  const b = prog(f, to - T, to, IN);
  let clip: string | undefined;
  let transform = '';
  let opacity = 1;
  let filter: string | undefined;
  const apply = (kind: Kind, p: number, out: boolean) => {
    if (p >= 1) return;
    if (kind === 'mask') {
      const k = 1 - p;
      clip = `inset(${k * 32}% ${k * 26}% ${k * 32}% ${k * 26}% round ${k * 120 + 0}px)`;
      transform += `scale(${lerp(out ? 0.97 : 1.05, 1, p)}) `;
    }
    if (kind === 'slide') transform += `translateY(${(1 - p) * (out ? -UH : UH)}px) `;
    if (kind === 'blur') {
      opacity *= p;
      transform += `scale(${lerp(out ? 0.96 : 1.07, 1, p)}) `;
      filter = `blur(${(1 - p) * 14}px)`;
    }
    if (kind === 'iris') clip = `circle(${lerp(0, 76, p)}% at 50% 44%)`;
  };
  apply(enter, a, false);
  if (b > 0) apply(exit, 1 - b, true);
  return (
    <div style={{ position: 'absolute', inset: 0, clipPath: clip, transform: transform || undefined, opacity, filter, overflow: 'hidden' }}>
      <Backdrop f={f} />
      {children}
    </div>
  );
};

/** How much a stage is on screen (0..1) — drives the caption line position. */
const stageAmount = (f: number) =>
  Math.max(f >= CTA_AT - 8 ? prog(f, CTA_AT - 8, CTA_AT + 6) : 0, ...STAGES.map((st) => interpolate(f, [st.from, st.from + T, st.to - T, st.to], [0, 1, 1, 0], clamp)));

// ─── sound design ────────────────────────────────────────────────────────────
// Transitions and UI moments only; no music. Each sound is pre-levelled ~20 dB under the voice
// (scripts/generate-sfx-pro.mjs); `v` trims it further where it sits under dense speech.

type Cue = { at: number; src: string; v?: number };
const CTA_TYPE_END = CTA_AT + TYPE_START + CONTACT.phone.length * TYPE_FRAMES_PER_CHAR;

export const CUES: Cue[] = [
  { at: 41, src: 'pop' },
  { at: 90, src: 'blip' },
  { at: 178, src: 'pop' },
  { at: 207, src: 'whoosh' }, // stage 1 · mask reveal
  { at: 262, src: 'click' }, // «إضافة منتج»
  { at: 296, src: 'blip' },
  { at: 352, src: 'tick' }, // $100
  { at: 425, src: 'blip' }, // $120
  { at: 468, src: 'tick' }, // $150
  { at: 478, src: 'shimmer', v: 0.8 },
  { at: 496, src: 'click' }, // publish
  { at: 508, src: 'pop' }, // toast
  { at: 513, src: 'whoosh-low' }, // stage 1 · blur out
  { at: 548, src: 'blip' },
  { at: 641, src: 'pop' }, // +$30
  { at: 645, src: 'swipe' }, // stage 2 · slide up
  { at: 683, src: 'blip' },
  { at: 772, src: 'click' }, // «تاجر»
  { at: 794, src: 'tick' }, // «متابعة»
  { at: 820, src: 'chime' }, // approved
  { at: 840, src: 'click' },
  { at: 864, src: 'tick' },
  { at: 884, src: 'click' },
  { at: 895, src: 'pop' }, // product added
  { at: 903, src: 'tick' }, // qty +
  { at: 958, src: 'click' }, // review
  { at: 966, src: 'chime' }, // order created
  { at: 979, src: 'whoosh' }, // phone → browser
  { at: 1008, src: 'click' },
  { at: 1024, src: 'tick' },
  { at: 1032, src: 'pop' }, // «مؤكد»
  { at: 1036, src: 'riser', v: 0.8 }, // light travels to «تم التسليم»
  { at: 1067, src: 'swipe' }, // link line
  { at: 1094, src: 'blip' }, // shipping partner connected
  { at: 1122, src: 'tick' },
  { at: 1144, src: 'whoosh-low' }, // stage 2 · iris out
  { at: 1167, src: 'pop' },
  { at: 1288, src: 'blip' },
  { at: 1330, src: 'riser', v: 0.8 }, // into stage 3
  { at: 1387, src: 'click' },
  { at: 1403, src: 'tick' },
  { at: 1412, src: 'click' },
  { at: 1418, src: 'chime' }, // delivered
  { at: 1427, src: 'swipe-down' }, // back to home
  { at: 1454, src: 'shimmer', v: 0.8 }, // profit lands
  { at: 1500, src: 'click' },
  { at: 1503, src: 'swipe' }, // sheet
  { at: 1516, src: 'tick' },
  { at: 1531, src: 'whoosh' }, // admin window
  { at: 1570, src: 'click' },
  { at: 1574, src: 'chime' },
  { at: 1585, src: 'whoosh-low' },
  { at: 1603, src: 'pop' },
  { at: 1622, src: 'blip' },
  { at: 1639, src: 'pop' },
  { at: 1658, src: 'blip' },
  { at: 1674, src: 'pop' },
  { at: 1687, src: 'whoosh' }, // tiles converge
  { at: 1697, src: 'shimmer' }, // logo
  { at: 1730, src: 'swipe' }, // logo → store vs ecosystem
  { at: 1766, src: 'whoosh-low' }, // ecosystem rises
  { at: 1787, src: 'tick' },
  { at: 1826, src: 'shimmer', v: 0.8 },
  { at: 1842, src: 'swipe-down' }, // stage 3 · mask out
  { at: 1877, src: 'pop' },
  { at: CTA_AT - 3, src: 'whoosh' }, // WhatsApp card rises
  { at: CTA_AT + TYPE_START, src: 'tick' },
  { at: Math.round(CTA_TYPE_END + 4), src: 'pop' },
  { at: Math.round(CTA_TYPE_END + 7), src: 'shimmer', v: 0.8 },
];

/** Per-family trim: sustained sounds (whoosh/shimmer/chime) read louder than short UI ticks at equal RMS. */
const GAIN: Record<string, number> = { whoosh: 0.72, swipe: 0.75, chime: 0.72, shimmer: 0.7, riser: 0.7, pop: 1, blip: 1, click: 1, tick: 1 };

// never the same sound (family) twice in a row
const family = (s: string) => s.replace(/-(low|down)$/, '');
CUES.forEach((c, i) => {
  if (i && family(CUES[i - 1].src) === family(c.src)) throw new Error(`SFX repeats back-to-back: ${c.src} @${c.at}`);
  if (i && CUES[i - 1].at > c.at) throw new Error(`SFX out of order @${c.at}`);
});

// ─── composition ─────────────────────────────────────────────────────────────

export const Pro = ({ stem = 'mix' }: { stem?: 'mix' | 'voice' | 'sfx' }) => {
  const f = useCurrentFrame();
  const capY = lerp(1338, 1456, stageAmount(f));
  return (
    <AbsoluteFill style={{ backgroundColor: '#06261D' }}>
      <Footage f={f} />

      <AbsoluteFill>
        <div style={{ width: UW, height: UH, transform: `scale(${RW / UW})`, transformOrigin: '0 0', position: 'relative', overflow: 'hidden' }}>
          {/* overlays on footage */}
          <TalkCallouts f={f} />
          <PriceFormula f={f} at={548} commissionAt={641} until={652} />
          <ZoneChips f={f} a={1167} b={1288} until={1336} />
          <AskCard f={f} at={1877} until={CTA_AT - 2} />

          {/* brand stages over the screen-recording b-roll */}
          <StageShell f={f} {...STAGES[0]}>
            <DashScene1 f={f} />
          </StageShell>
          <StageShell f={f} {...STAGES[1]}>
            <AppScene1 f={f} />
            <DashScene2 f={f} />
          </StageShell>
          <StageShell f={f} {...STAGES[2]}>
            <AppScene2 f={f} />
            <AllInOne f={f} />
            <Compare f={f} />
          </StageShell>

          {f >= CTA_AT && (
            <Sequence from={CTA_AT} layout="none" name="whatsapp card">
              <WhatsAppCard />
            </Sequence>
          )}
          <Captions f={f} pages={PAGES} y={capY} />
        </div>
      </AbsoluteFill>

      {stem !== 'sfx' &&
        PLACED.map((c, i) => (
          <Sequence key={i} from={c.at} durationInFrames={c.len} layout="none" name={`voice ${i + 1}`}>
            <Audio src={staticFile('footage/voice-pro.wav')} trimBefore={c.from} />
          </Sequence>
        ))}
      {stem !== 'voice' &&
        CUES.map((c, i) => (
          <Sequence key={i} from={c.at} layout="none" name={`sfx ${c.src}`}>
            <Audio src={staticFile(`sfx/pro/${c.src}.wav`)} volume={(GAIN[family(c.src)] ?? 1) * (c.v ?? 1)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};

export { TOTAL as PRO_TOTAL };
