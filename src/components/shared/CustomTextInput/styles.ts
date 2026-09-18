import { FONTS, hp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginBottom: hp(1.8),
    width: '100%',
  },
  label: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: '#111A2C',
    width: '100%',
    textAlign: 'left',
  },
  requiredStar: {
    color: '#e74c3c',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hp(1.2),
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: hp(1.5),
    paddingHorizontal: hp(2),
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    minHeight: hp(6),
  },
  input: {
    flex: 1,
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#111A2C',
    paddingVertical: hp(1.5),
    textAlign: 'right',
  },
  textArea: {
    height: hp(12),
    textAlignVertical: 'top',
    paddingTop: hp(1.5),
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: hp(1.4),
    fontFamily: FONTS.fontFamilyRegular,
    marginTop: hp(0.5),
  },
});
