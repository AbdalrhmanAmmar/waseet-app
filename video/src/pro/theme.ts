import { loadFont } from '@remotion/google-fonts/Tajawal';
import { Easing } from 'remotion';

export { C, clamp } from '../theme';
export { D } from '../reel/theme';

// Output is the source's 2160×3840 @ 30fps; everything is designed on a 1080×1920 grid and scaled ×2.
export const FPS = 30;
export const RW = 2160;
export const RH = 3840;
export const UW = 1080;
export const UH = 1920;

export const FONT = loadFont('normal', { weights: ['400', '500', '700', '800', '900'], subsets: ['arabic', 'latin'] }).fontFamily;

/** Smooth in-out used for camera moves and page transitions (no linear motion anywhere). */
export const EASE = Easing.bezier(0.65, 0, 0.35, 1);
/** Fast-settle out curve for entrances. */
export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
/** Gentle accelerate for exits. */
export const IN = Easing.bezier(0.7, 0, 0.84, 0);

export const GLOW = '#F29A4A';
export const KEY = '#7FE3C6'; // caption keyword tint (brand mint, readable on dark)
