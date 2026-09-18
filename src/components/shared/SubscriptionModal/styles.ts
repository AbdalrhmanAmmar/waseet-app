import { COLORS, FONTS, hp, wp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    padding: wp(6),
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: hp(2),
    right: wp(4),
    padding: wp(1),
    zIndex: 10,
  },
  iconCircle: {
    marginBottom: hp(2),
    borderRadius: hp(4.5),
    overflow: 'hidden',
  },
  iconGradient: {
    width: hp(9),
    height: hp(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: hp(2.5),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: hp(3),
    paddingHorizontal: wp(2),
    lineHeight: hp(2.2),
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: hp(3),
    paddingHorizontal: wp(2),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  featureIcon: {
    marginRight: wp(3),
  },
  featureText: {
    fontSize: hp(1.7),
    fontFamily: FONTS.fontFamilyMedium,
    color: COLORS.charcoal,
  },
  subscribeBtn: {
    width: '100%',
    height: hp(6.5),
    overflow: 'hidden',
    marginBottom: hp(1.5),
  },
  subscribeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtnText: {
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.white,
  },
  skipBtn: {
    paddingVertical: hp(1),
  },
  skipBtnText: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyMedium,
    color: COLORS.gray,
  },
});
