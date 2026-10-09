import { Audio } from '@remotion/media';
import { interpolate, Sequence, staticFile } from 'remotion';
import { HOPS } from './scenes/Scene2Islands';
import { COIN_FRAME, ROLE_POP_FRAMES } from './scenes/Scene3Constellation';
import { HIT } from './scenes/Scene4Logo';
import { clamp, DURATION, SCENES } from './theme';

type Cue = { at: number; src: string; volume: number };

const s2 = SCENES.islands.from;
const s3 = SCENES.constellation.from;
const s4 = SCENES.logo.from;
const LOGO_HIT = s4 + HIT;
const RISER_FRAMES = 90; // riser.wav is exactly 3s and peaks into the logo hit

const CUES: Cue[] = [
  // scene 1 — spark falls, cube is born
  { at: 8, src: 'shimmer-soft', volume: 0.45 },
  { at: 22, src: 'whoosh-1', volume: 0.55 },
  { at: 54, src: 'impact', volume: 0.85 },
  { at: 56, src: 'shimmer', volume: 0.5 },
  { at: 98, src: 'shimmer-soft', volume: 0.25 },
  { at: 134, src: 'whoosh-2', volume: 0.65 },
  // scene 2 — the order hops island to island, one chime per status
  ...HOPS.flatMap((h, i) => [
    { at: s2 + h.start, src: i === 0 ? 'whoosh-1' : 'whoosh-3', volume: i === 0 ? 0.4 : 0.3 },
    { at: s2 + h.end, src: `chime-${i + 1}`, volume: 0.55 },
    { at: s2 + h.end + 2, src: 'pop', volume: 0.35 },
  ]),
  { at: s3 - 6, src: 'whoosh-2', volume: 0.45 },
  // scene 3 — balance card and team
  { at: s3 + 8, src: 'swell', volume: 0.3 },
  { at: s3 + 10, src: 'whoosh-3', volume: 0.3 },
  ...ROLE_POP_FRAMES.map((f) => ({ at: s3 + f, src: 'pop', volume: 0.28 })),
  { at: s3 + COIN_FRAME, src: 'coin', volume: 0.55 },
  // scene 4 — build-up and logo reveal
  { at: LOGO_HIT - RISER_FRAMES, src: 'riser', volume: 0.6 },
  { at: LOGO_HIT, src: 'logo-hit', volume: 0.8 },
  { at: s4 + 82, src: 'shimmer', volume: 0.4 },
  { at: s4 + 100, src: 'shimmer-soft', volume: 0.25 },
];

export const Soundtrack = () => (
  <>
    <Audio
      src={staticFile('sfx/music.wav')}
      volume={(f) => 0.5 * interpolate(f, [LOGO_HIT - 30, LOGO_HIT], [1, 0.75], clamp) * interpolate(f, [DURATION - 24, DURATION], [1, 0], clamp)}
    />
    {CUES.map((c, i) => (
      <Sequence key={i} from={c.at} layout="none" name={`sfx ${c.src}`}>
        <Audio src={staticFile(`sfx/${c.src}.wav`)} volume={c.volume} />
      </Sequence>
    ))}
  </>
);
