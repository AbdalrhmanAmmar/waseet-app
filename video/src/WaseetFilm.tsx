import './fonts';
import { AbsoluteFill, Sequence } from 'remotion';
import { Grain, Sky } from './components/Sky';
import { Scene1Portal } from './scenes/Scene1Portal';
import { Scene2Islands } from './scenes/Scene2Islands';
import { Scene3Constellation } from './scenes/Scene3Constellation';
import { Scene4Logo } from './scenes/Scene4Logo';
import { Soundtrack } from './Soundtrack';
import { SCENES } from './theme';

export const WaseetFilm = () => (
  <AbsoluteFill style={{ backgroundColor: '#06261D' }}>
    <Sky />
    <Sequence from={SCENES.portal.from} durationInFrames={SCENES.portal.duration} name="1 · البوابة">
      <Scene1Portal />
    </Sequence>
    <Sequence from={SCENES.islands.from} durationInFrames={SCENES.islands.duration} name="2 · الجزر الطائرة">
      <Scene2Islands />
    </Sequence>
    <Sequence from={SCENES.constellation.from} durationInFrames={SCENES.constellation.duration} name="3 · الكوكبة">
      <Scene3Constellation />
    </Sequence>
    <Sequence from={SCENES.logo.from} durationInFrames={SCENES.logo.duration} name="4 · ميلاد الشعار">
      <Scene4Logo />
    </Sequence>
    <Grain />
    <Soundtrack />
  </AbsoluteFill>
);
