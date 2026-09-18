import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
type Props = Omit<LinearGradientProps, 'colors'> & { colors: readonly string[] };
export default function Gradient({ colors, ...props }: Props) {
  const safe = colors.length >= 2 ? colors : [colors[0] ?? '#fff', colors[0] ?? '#fff'];
  return <LinearGradient {...props} colors={safe as [string, string, ...string[]]} />;
}
