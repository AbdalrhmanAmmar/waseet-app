import { COLORS, FONTS, hp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: hp(2.4),
  },
  emptyText: {
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.darkgray2,
    marginTop: hp(1.6),
    marginBottom: hp(2.4),
  },
});
