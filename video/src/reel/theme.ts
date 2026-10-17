import { loadFont } from '@remotion/google-fonts/Alexandria';

export { C, FONT, clamp } from '../theme';

// Output is 4K vertical; overlays are designed on a 1080×1920 grid and scaled ×2.
export const RW = 2160;
export const RH = 3840;
export const UW = 1080;
export const UH = 1920;
export const FPS = 30;

export const CAPTION_FONT = loadFont('normal', { weights: ['600', '800'], subsets: ['arabic', 'latin'] }).fontFamily;

// Dashboard palette (../../dashboard/src/index.css)
export const D = {
  bg: '#F4F7F5',
  sidebar: '#F8FAF9',
  card: '#FFFFFF',
  border: '#D9E3DE',
  divider: '#E7EDEA',
  primary: '#0C876B',
  primarySoft: '#E5F5EF',
  fg: '#17241F',
  fgSoft: '#3C5148',
  muted: '#65756E',
  success: '#159A79',
  warning: '#E58A32',
  danger: '#D7554D',
  info: '#3E86C6',
};
