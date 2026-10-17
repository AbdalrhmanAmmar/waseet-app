import { C } from '../theme';
import { CubeFaces, LOGO } from './Cube';

/** Static brand mark (assets/branding/logo.svg geometry). */
export const LogoMark = ({ size, id = 'mark', tile = false }: { size: number; id?: string; tile?: boolean }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block' }}>
    {tile && <rect width={64} height={64} rx={15} fill={C.background} />}
    {LOGO.arcs.map((d) => (
      <path key={d} d={d} fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" />
    ))}
    {LOGO.connectors.map((d) => (
      <path key={d} d={d} stroke={C.primary} strokeWidth={3} strokeLinecap="round" />
    ))}
    {LOGO.nodes.map((n) => (
      <circle key={`${n.x}-${n.y}`} cx={n.x} cy={n.y} r={LOGO.nodeR} fill={C.primary} />
    ))}
    <CubeFaces id={id} shaded={false} />
  </svg>
);
