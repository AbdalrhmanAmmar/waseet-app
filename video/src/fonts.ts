import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { FONT } from './theme';

for (const [file, weight] of [
  ['Tajawal-Regular.ttf', '400'],
  ['Tajawal-Medium.ttf', '500'],
  ['Tajawal-Bold.ttf', '700'],
] as const) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}
