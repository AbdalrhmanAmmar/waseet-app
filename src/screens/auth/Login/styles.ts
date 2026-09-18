import { COLORS, FONTS, hp, wp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.white },
  overlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(8),
    paddingBottom: hp(5),
  },
  scrollKeyboard: {
    paddingBottom: hp(15),
  },
  brand: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  logoCircle: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(2),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  content: {
    flexGrow: 1,
    flexShrink: 0,
  },
  title: {
    fontSize: hp(3.5),
    fontFamily: FONTS.fontFamilyBold,
    color: '#111A2C',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#757D85',
    textAlign: 'center',
    marginBottom: hp(5),
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: hp(1),
    marginBottom: hp(4),
  },
  forgotText: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyMedium,
    color: COLORS.mainOrange,
  },
  loginBtn: {
    backgroundColor: COLORS.mainOrange,
    borderRadius: hp(1.5),
    height: hp(7),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: COLORS.mainOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnText: {
    fontSize: hp(2.1),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.white,
  },
  signupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
  },
  signupHint: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#111A2C',
  },
  signupLink: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.mainOrange,
  },
});
