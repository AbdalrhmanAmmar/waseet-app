import { COLORS, FONTS, hp, wp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarBox: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(2.5),
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  avatarText: {
    fontSize: hp(3.5),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.mainOrange,
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: hp(1.7),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.mainOrange,
    marginBottom: hp(1.5),
    textAlign: 'left',
  },
  btnContainer: {
    marginTop: hp(2),
    marginBottom: hp(3),
  },
});
