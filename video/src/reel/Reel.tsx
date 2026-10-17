import '../fonts';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Captions } from './Captions';
import { CTA, CUES, HOLD, INSERTS, OVERLAYS, PAGES, PLACED, TOTAL } from './reel-data';
import { clamp, FPS, RW, UH, UW } from './theme';
import { WhatsAppCard } from './WhatsAppCard';

const GRADE = 'contrast(1.06) saturate(1.08) brightness(1.02)';

/** One kept range of the source with a slow push-in; `zoom` gives jump-cut punch-ins. */
const Shot = ({ zoom = 1, len, src }: { zoom?: number; len: number; src: number }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, len], [0, 0.035], clamp);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom + drift})`, transformOrigin: '50% 35%' }}>
      <OffthreadVideo src={staticFile('footage/waseet-talk.mp4')} trimBefore={src} muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: GRADE }} />
    </AbsoluteFill>
  );
};

/** Last frame held (with blur + slow zoom) under the WhatsApp card. */
const Hold = ({ zoom }: { zoom: number }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom + 0.035 + frame * 0.0005})`, transformOrigin: '50% 35%' }}>
      <Img src={staticFile('footage/last-frame.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: GRADE }} />
    </AbsoluteFill>
  );
};

export const Reel = () => {
  const frame = useCurrentFrame();
  const last = PLACED[PLACED.length - 1];
  const ctaBlur = interpolate(frame, [CTA.at, CTA.at + 14], [0, 18], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: '#06261D' }}>
      <AbsoluteFill style={{ filter: ctaBlur ? `blur(${ctaBlur}px)` : undefined }}>
        {PLACED.map((c, i) => (
          <Sequence key={i} from={c.at} durationInFrames={c.len} name={`shot ${i + 1}`}>
            <Shot zoom={c.zoom} len={c.len} src={c.from} />
          </Sequence>
        ))}
        <Sequence from={last.at + last.len} durationInFrames={HOLD} name="hold">
          <Hold zoom={last.zoom ?? 1} />
        </Sequence>
      </AbsoluteFill>

      {/* voice (mastered) follows the same cuts */}
      {PLACED.map((c, i) => (
        <Sequence key={i} from={c.at} durationInFrames={c.len} layout="none" name={`voice ${i + 1}`}>
          <Audio src={staticFile('footage/voice-master.wav')} trimBefore={c.from} />
        </Sequence>
      ))}

      <AbsoluteFill style={{ background: 'radial-gradient(120% 80% at 50% 40%, transparent 55%, rgba(4,30,22,0.5) 100%)' }} />

      <AbsoluteFill>
        <div style={{ width: UW, height: UH, transform: `scale(${RW / UW})`, transformOrigin: '0 0', position: 'relative', overflow: 'hidden' }}>
          {INSERTS.map((b, i) => (
            <Sequence key={i} from={b.at} durationInFrames={b.len} name={`insert · ${b.name}`} layout="none">
              {b.render(b.len)}
            </Sequence>
          ))}
          {OVERLAYS.map((b, i) => (
            <Sequence key={i} from={b.at} durationInFrames={b.len} name={`overlay · ${b.name}`} layout="none">
              {b.render(b.len)}
            </Sequence>
          ))}
          <Sequence from={CTA.at} name="whatsapp card" layout="none">
            <WhatsAppCard />
          </Sequence>
          <Captions pages={PAGES} y={1360} hidden={(t) => t * FPS >= CTA.at} />
        </div>
      </AbsoluteFill>

      <Audio src={staticFile('sfx/reel-bed.wav')} volume={(f) => 0.12 * interpolate(f, [0, 15, CTA.at, CTA.at + 20, TOTAL - 40, TOTAL], [0, 1, 1, 1.8, 1.8, 0], clamp)} />
      {CUES.map((c, i) => (
        <Sequence key={i} from={c.at} layout="none" name={`sfx ${c.src}`}>
          <Audio src={staticFile(`sfx/${c.src}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
