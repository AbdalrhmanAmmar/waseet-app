import { COLORS, FONTS, hp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hp(1.9),
    paddingVertical: hp(1.4),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  left: {
    width: hp(5.2),
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: hp(5.2),
    alignItems: 'flex-end',
  },
  backBtn: {
    width: hp(4.7),
    height: hp(4.7),
    borderRadius: hp(1.4),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordercolor,
  },
  title: {
    fontSize: hp(2.0),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
    textAlign: 'center',
  },
});
