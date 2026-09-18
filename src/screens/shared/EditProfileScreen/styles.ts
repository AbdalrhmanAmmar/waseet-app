import { COLORS, FONTS, hp, wp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pageColor,
  },
  scroll: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(12),
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: hp(2),
    padding: wp(4),
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
    borderWidth: 1,
    borderColor: COLORS.bordercolor,
  },
  avatarBox: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(2.5),
    backgroundColor: '#EDF6F1',
    borderWidth: 2,
    borderColor: COLORS.bordercolor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  avatarText: {
    fontSize: hp(3.5),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: hp(2),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
  },
  headerSubtitle: {
    fontSize: hp(1.4),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  formBox: {
    backgroundColor: COLORS.white,
    borderRadius: hp(2),
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
    borderWidth: 1,
    borderColor: COLORS.bordercolor,
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
    marginBottom: hp(1.5),
    textAlign: 'right',
  },
  btnContainer: {
    marginTop: hp(2),
    marginBottom: hp(3),
  },
});
