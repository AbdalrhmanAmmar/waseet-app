// Brand tokens mirrored from ../src/theme/tokens.ts and ../src/theme/theme.ts
export const C = {
  primary: '#147D64',
  primary300: '#72B69F',
  primary400: '#21896F',
  primary800: '#0C5141',
  deep: '#103E32',
  deepCard: '#19614D',
  night: '#06261D',
  secondary: '#3DBFA3',
  secondary300: '#6DD1BB',
  accent: '#F29A4A',
  accentLight: '#F7B675',
  accentDark: '#D9803A',
  background: '#F8FAF7',
  surface: '#FFFFFF',
  ink: '#203B32',
  muted: '#677A70',
  border: '#DFE8E1',
  soft: '#EDF6F1',
  warm: '#FFF1E2',
  mint: '#C6E7DB',
};

export const FONT = 'Tajawal';

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 600;

// Scenes overlap by 15 frames so each transition can blend into the next.
export const SCENES = {
  portal: { from: 0, duration: 165 },
  islands: { from: 150, duration: 165 },
  constellation: { from: 300, duration: 150 },
  logo: { from: 450, duration: 150 },
};

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
