import { COLORS, FONTS, wp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  text: {
    color: COLORS.black,
    fontSize: wp(3),
    fontFamily: FONTS.regular,
    textAlign: 'left',
  },
});
