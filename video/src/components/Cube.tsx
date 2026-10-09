import { C } from '../theme';

// Geometry taken from assets/branding/logo.svg (64×64 viewBox).
export const LOGO = {
  nodes: [
    { x: 32, y: 12 },
    { x: 13, y: 48 },
    { x: 51, y: 48 },
  ],
  nodeR: 6,
  connectors: ['M32 18v8', 'M18 44l8-5', 'M46 44l-8-5'],
  arcs: ['M22 16A22 22 0 0 0 11 39', 'M42 16a22 22 0 0 1 11 23', 'M20 52a22 22 0 0 0 24 0'],
  cubeEdges: 'm22 29.5 10 5.7 10-5.7M32 35.2V47',
};

const FACES = {
  top: { d: 'M22 29.5 32 24l10 5.5-10 5.7Z', dx: 0, dy: -7 },
  left: { d: 'M22 29.5 32 35.2V47l-10-5.5Z', dx: -7, dy: 4 },
  right: { d: 'M32 35.2 42 29.5v12L32 47Z', dx: 7, dy: 4 },
};

type CubeFacesProps = {
  /** 0 → faces scattered, 1 → assembled */
  assemble?: number;
  /** 0..1 draw progress of the white edges */
  edges?: number;
  /** Shaded faces for the fantasy scenes; flat brand orange for the logo. */
  shaded?: boolean;
  id: string;
};

/** The logo's package cube, drawn in logo coordinates so it can be placed inside any 64-unit group. */
export const CubeFaces = ({ assemble = 1, edges = 1, shaded = true, id }: CubeFacesProps) => {
  const fills = shaded
    ? { top: `url(#${id}-top)`, left: `url(#${id}-left)`, right: `url(#${id}-right)` }
    : { top: C.accent, left: C.accent, right: C.accent };
  const open = 1 - assemble;
  return (
    <g>
      {shaded && (
        <defs>
          <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFD3A3" />
            <stop offset="1" stopColor={C.accentLight} />
          </linearGradient>
          <linearGradient id={`${id}-left`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.accentLight} />
            <stop offset="1" stopColor={C.accent} />
          </linearGradient>
          <linearGradient id={`${id}-right`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.accent} />
            <stop offset="1" stopColor="#C96D27" />
          </linearGradient>
        </defs>
      )}
      {(Object.keys(FACES) as (keyof typeof FACES)[]).map((k) => (
        <path
          key={k}
          d={FACES[k].d}
          fill={fills[k]}
          opacity={Math.min(1, assemble * 1.6)}
          transform={`translate(${FACES[k].dx * open} ${FACES[k].dy * open}) rotate(${open * (k === 'top' ? -40 : k === 'left' ? 30 : -30)} 32 35.5)`}
        />
      ))}
      <path
        d={LOGO.cubeEdges}
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - edges}
      />
    </g>
  );
};

type CubeProps = CubeFacesProps & { size: number; glow?: number };

/** Stand-alone glowing cube (used by the fantasy scenes). `size` is the rendered width in px. */
export const Cube = ({ size, glow = 1, ...rest }: CubeProps) => (
  <div style={{ position: 'relative', width: size, height: size * 1.12 }}>
    <div
      style={{
        position: 'absolute',
        inset: -size * 0.7,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, rgba(242,154,74,${0.55 * glow}), rgba(242,154,74,${0.12 * glow}) 55%, transparent)`,
      }}
    />
    <svg viewBox="20 22.5 24 26.9" width={size} height={size * 1.12} style={{ position: 'absolute', overflow: 'visible' }}>
      <CubeFaces {...rest} />
    </svg>
  </div>
);
