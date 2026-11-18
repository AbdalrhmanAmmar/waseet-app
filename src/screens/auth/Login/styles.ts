import { StyleSheet } from 'react-native';
import { palette as p, typography as t } from '@/theme/tokens';
export const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 3 },
  logo: { width: 68, height: 68 },
  brandName: {
    fontFamily: t.bold,
    fontSize: 27,
    lineHeight: 37,
    color: p.deep,
    textAlign: 'center',
  },
  intro: { alignItems: 'center', marginTop: 8, marginBottom: 4, gap: 5 },
  title: { fontFamily: t.bold, fontSize: 29, lineHeight: 40, color: p.deep, textAlign: 'center' },
  subtitle: { color: p.muted, fontSize: 14, lineHeight: 23, textAlign: 'center' },
  signup: { gap: 12, marginTop: 5 },
  signupHint: { color: p.muted, fontSize: 14, lineHeight: 23, textAlign: 'center' },
  caption: {
    color: p.muted,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
