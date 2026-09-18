import { StyleSheet } from 'react-native';
import { palette, typography } from '@/theme/tokens';
export const styles = StyleSheet.create({
  text: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: typography.regular,
    textAlign: 'right',
  },
});
