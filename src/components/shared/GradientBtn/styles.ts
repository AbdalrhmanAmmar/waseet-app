import { COLORS, FONTS, hp } from '@/theme/index';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    borderRadius: hp(2),
    overflow: 'hidden',
    width: '99%',
    alignSelf: 'center',
    height: hp(6.9),
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: hp(1.2),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: hp(1.2),
  },

  text: {
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.white,
  },
});

export default styles;
