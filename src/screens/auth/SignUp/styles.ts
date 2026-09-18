import { COLORS, FONTS, hp, wp } from '@/theme/index';
import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  scroll: {
    paddingHorizontal: wp(5),
    paddingTop: hp(7),
    paddingBottom: hp(6),
  },
  scrollKeyboard: {
    paddingBottom: hp(15),
  },
  header: {
    position: 'absolute',
    top: hp(5.5),
    zIndex: 10,
    ...Platform.select({
      ios: {
        left: wp(4),
      },
      android: {
        left: wp(4),
      },
    }),
  },
  backBtn: {
    width: hp(4.8),
    height: hp(4.8),
    borderRadius: hp(1.4),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  brand: {
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  logoCircle: {
    width: hp(8.5),
    height: hp(8.5),
    borderRadius: hp(2.2),
    backgroundColor: '#EDF6F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFE4DB',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: hp(3),
    fontFamily: FONTS.fontFamilyBold,
    color: '#111A2C',
    textAlign: 'center',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: hp(1.55),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: hp(2.5),
  },

  // Form Section Group Card
  sectionGroup: {
    backgroundColor: COLORS.white,
    borderRadius: hp(2),
    padding: hp(1.8),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: hp(1.4),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sectionIconBox: {
    width: hp(3.4),
    height: hp(3.4),
    borderRadius: hp(1),
    backgroundColor: '#EDF6F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
  },

  // Roles Grid (Compact)
  userTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: hp(1),
  },
  userTypeCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: hp(1.2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(2.5),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  userTypeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EDF6F1',
  },
  userTypeIcon: {
    marginRight: 6,
  },
  userTypeTitle: {
    fontSize: hp(1.35),
    fontFamily: FONTS.fontFamilyBold,
    color: '#334155',
    flex: 1,
  },
  userTypeTitleActive: {
    color: COLORS.primary,
  },
  userTypeCheck: {
    marginLeft: 4,
  },

  // Inputs Row
  inputsRow: {
    flexDirection: 'row',
    gap: hp(1.5),
  },
  inputFlex: {
    flex: 1,
  },

  // Country Picker Box
  countryPickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: hp(0.8),
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    marginRight: hp(1),
  },
  countryCode: {
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyBold,
    color: '#1E293B',
  },

  // Submit Button
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: hp(1.6),
    height: hp(6.5),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: hp(1),
    marginBottom: hp(2.5),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.white,
  },

  // Login Row
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(0.5),
    marginBottom: hp(4),
    gap: 4,
  },
  loginHint: {
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#64748B',
  },
  loginLink: {
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: hp(2.5),
    borderTopRightRadius: hp(2.5),
    paddingBottom: hp(4),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
  },
  cancelText: {
    fontSize: hp(1.6),
    color: COLORS.gray,
    fontFamily: FONTS.fontFamilyMedium,
  },
  confirmText: {
    fontSize: hp(1.6),
    color: COLORS.primary,
    fontFamily: FONTS.fontFamilyBold,
  },

  // City Selection
  cityListContainer: {
    paddingHorizontal: 16,
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.6),
    paddingHorizontal: 14,
    borderRadius: hp(1.4),
    marginBottom: hp(1),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cityItemSelected: {
    backgroundColor: '#EDF6F1',
    borderColor: COLORS.primary,
  },
  cityIconBox: {
    width: hp(4.2),
    height: hp(4.2),
    borderRadius: hp(1.2),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityIconBoxSelected: {
    backgroundColor: '#EDF6F1',
    borderColor: '#C9E3D5',
  },
  cityName: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
  },
  cityNameSelected: {
    color: COLORS.primary,
  },

  inputIcon: {
    marginRight: 8,
  },
  hiddenCountryPicker: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  modalHeaderSpacer: {
    width: hp(2.6),
  },
  cityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Date Picker
  pickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    height: hp(25),
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    textAlign: 'center',
    fontSize: hp(1.5),
    color: COLORS.gray,
    marginTop: 8,
    fontFamily: FONTS.fontFamilyMedium,
  },
  picker: {
    height: hp(20),
    color: COLORS.charcoal,
  },
});
