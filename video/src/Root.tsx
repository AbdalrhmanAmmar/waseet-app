import { Composition } from 'remotion';
import { WaseetFilm } from './WaseetFilm';
import { DURATION, FPS, H, W } from './theme';

export const RemotionRoot = () => (
  <Composition id="WaseetFilm" component={WaseetFilm} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
