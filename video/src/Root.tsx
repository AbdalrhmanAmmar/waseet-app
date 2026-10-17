import { Composition } from 'remotion';
import { Pro, PRO_TOTAL } from './pro/Pro';
import { Reel } from './reel/Reel';
import { TOTAL } from './reel/reel-data';
import { WaseetFilm } from './WaseetFilm';
import { DURATION, FPS, H, W } from './theme';

export const RemotionRoot = () => (
  <>
    <Composition id="WaseetFilm" component={WaseetFilm} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="WaseetReel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={2160} height={3840} />
    <Composition id="WaseetPro" component={Pro} durationInFrames={PRO_TOTAL} fps={30} width={2160} height={3840} defaultProps={{ stem: 'mix' as const }} />
  </>
);
