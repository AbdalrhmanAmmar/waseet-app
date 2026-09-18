import { Dimensions, Platform } from 'react-native';

import { hp } from '@/theme/Dimensions';

const { width, height } = Dimensions.get('window');

export const IS_IOS = Platform.OS === 'ios';
export const IS_IPHONE_X = false;
export const COLORS = {
  pageColor: '#F5F6FA',
  // Primary colors (Orange)
  primary: '#E65317',
  primary300: '#F0956A',
  primary400: '#D95F28',
  primary800: '#A03A10',
  primary100: '#FFF3EE',
  pinkybg: '#FFF8F5',
  mainOrange: '#FF5C28',

  // Dark (Charcoal)
  charcoal: '#3D3D4E',
  charcoal80: 'rgba(61, 61, 78, 0.8)',

  // Secondary colors (Teal)
  secondary: '#3DBFA3',
  secondary300: '#6DD1BB',
  secondary700: '#2A8A76',

  black: '#000000',
  green: '#60c5a8',
  green2: '#00B112',
  darkBlue: '#111A2C',
  darkGray: '#525C67',
  darkGray2: '#757D85',
  bg: '#3d434c',
  bg2: '#373b43',
  bg3: '#464c59',
  gray: '#BDBDBD',
  gray4: '#D9D9D9',
  gray5: '#E0E0E0',
  gray2: '#D9D9D9',
  gray3: '#ECECEC',
  gray6: '#707070',
  lightGray: '#F5F5F6',
  lightGray2: '#F6F6F7',
  lightGray3: '#EFEFF1',
  lightGray4: '#F8F8F9',
  transparent: 'transparent',
  darkgray: '#898C95',
  darkgray2: '#828282',
  white: '#FFFFFF',
  white2: '#FBFBFB',
  offwhite: '#FDFEFE',
  gray100: '#E3E5EC',
  darkOverlayColor: 'rgba(0, 0, 0, 0.4)',
  darkOverlayColor2: 'rgba(0, 0, 0, 0.8)',
  transparentWhite1: 'rgba(255, 255, 255, 0.1)',
  transparentBlack1: 'rgba(0, 0, 0, 0.1)',
  transparentBlack7: 'rgba(0, 0, 0, 0.7)',
  transparentGreen: 'rgba(0, 225, 0, 0.2)',
  transparentRed: 'rgba(255, 0, 0, 0.2)',
  primaryAlpha: 'rgba(230, 83, 23, 0.85)',
  greenAlpha: 'rgba(96, 197, 168, 0.15)',
  redAlpha: 'rgba(255, 84, 84, 0.15)',
  purpleAlpha: 'rgba(146, 6, 228, 0.15)',
  // bags background colors
  bag1Bg: '#ea7a72',
  bag2Bg: '#c2c5d1',
  bag3Bg: '#82a7c9',
  bag4Bg: '#d49d8f',
  bag5Bg: '#ccd9c6',
  bag6Bg: '#767676',
  bag7Bg: '#d1c8c3',
  bag8Bg: '#dca47f',
  bag9Bg: '#eb849c',
  bag10Bg: '#979dc1',
  bag11Bg: '#c7d3c0',
  bordercolor: '#E5E7EB',

  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Error
  error: 'rgba(246, 86, 93, 1)',
  error80: 'rgba(246, 86, 93, 0.8)',
  error60: 'rgba(246, 86, 93, 0.6)',
  error20: 'rgba(246, 86, 93, 0.2)',
  error08: 'rgba(246, 86, 93, 0.08)',

  // Success
  success: 'rgba(253, 212, 70, 1)',
  success80: 'rgba(253, 212, 70, 0.8)',
  success60: 'rgba(253, 212, 70, 0.6)',
  success20: 'rgba(253, 212, 70, 0.2)',
  success08: 'rgba(253, 212, 70, 0.08)',

  // Dark
  dark: 'rgba(13, 15, 35, 1)',
  dark80: 'rgba(13, 15, 35, 0.8)',
  dark60: 'rgba(13, 15, 35, 0.6)',
  dark20: 'rgba(13, 15, 35, 0.2)',
  dark08: 'rgba(13, 15, 35, 0.08)',

  // Grey
  grey: 'rgba(160, 161, 180, 1)',
  grey80: 'rgba(160, 161, 180, 0.8)',
  grey60: 'rgba(160, 161, 180, 0.6)',
  grey20: 'rgba(160, 161, 180, 0.2)',
  grey08: 'rgba(160, 161, 180, 0.08)',

  // Light Grey
  lightGrey: 'rgba(247, 247, 247, 1)',
  lightGrey80: 'rgba(247, 247, 247, 0.8)',
  lightGrey60: 'rgba(247, 247, 247, 0.6)',
  lightGrey20: 'rgba(247, 247, 247, 0.2)',
  lightGrey08: 'rgba(247, 247, 247, 0.08)',

  // Light
  light: 'rgba(255, 255, 255, 1)',
  light80: 'rgba(255, 255, 255, 0.8)',
  light60: 'rgba(255, 255, 255, 0.6)',
  light20: 'rgba(255, 255, 255, 0.2)',
  light08: 'rgba(255, 255, 255, 0.08)',

  // Support Colors
  support1: 'rgba(110, 162, 255, 1)',
  support1_08: 'rgba(110, 162, 255, 0.08)',
  support2: 'rgba(249, 161, 218, 1)',
  support2_08: 'rgba(249, 161, 218, 0.08)',
  support3: 'rgba(0, 210, 224, 1)',
  support3_08: 'rgba(0, 210, 224, 0.08)',
  support4: 'rgba(255, 132, 13, 1)',
  support4_08: 'rgba(255, 132, 13, 0.08)',
  support5: 'rgba(123, 96, 238, 1)',
  support5_08: 'rgba(123, 96, 238, 0.08)',

  // Shadow
  shadowColor: 'rgba(138, 149, 158, 1)',
  shadow08: 'rgba(138, 149, 158, 0.08)',
};

// Primary Gradient Colors (from home screen buttons)
export const PRIMARY_GRADIENT = [COLORS.primary, '#f472b6'];
export const PRIMARY_GRADIENT_START = { x: 0, y: 0 };
export const PRIMARY_GRADIENT_END = { x: 1, y: 0 };

export const SIZES = {
  // Global sizes
  base: 8,
  font: hp(1.6),
  radius: 12,
  padding: 24,
  margin: 20,

  // Font sizes
  largeTitle: hp(4.7),
  h1: hp(3.5),
  h2: hp(2.6),
  h3: hp(1.9),
  h4: hp(1.6),
  h5: hp(1.4),
  body1: hp(3.5),
  body2: hp(2.6),
  body3: hp(1.9),
  body4: hp(1.6),
  body5: hp(1.4),

  // App dimensions
  width,
  height,
};
export const FONTS = {
  largeTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: SIZES.largeTitle,
  },
  h1: { fontFamily: 'Montserrat-Bold', fontSize: SIZES.h1 },
  h2: { fontFamily: 'Montserrat-SemiBold', fontSize: SIZES.h2 },
  h3: { fontFamily: 'Montserrat-Medium', fontSize: SIZES.h3 },
  h4: { fontFamily: 'Montserrat-Regular', fontSize: SIZES.h4 },
  h5: { fontFamily: 'Montserrat-Regular', fontSize: SIZES.h5 },
  body1: { fontFamily: 'Montserrat-Bold', fontSize: SIZES.body1 },
  body2: { fontFamily: 'Montserrat-SemiBold', fontSize: SIZES.body2 },
  body3: { fontFamily: 'Montserrat-Medium', fontSize: SIZES.body3 },
  body4: { fontFamily: 'Montserrat-Regular', fontSize: SIZES.body4 },
  body5: { fontFamily: 'Montserrat-Regular', fontSize: SIZES.body5 },

  // Font families
  fontFamilyRegular: 'Montserrat-Regular',
  fontFamilyLight: 'Montserrat-Light',
  fontFamilyBold: 'Montserrat-Bold',
  fontFamilyMedium: 'Montserrat-Medium',
  fontFamilySemiBold: 'Montserrat-SemiBold',

  // Montserrat specific variations
  regular: 'Montserrat-Regular',
  light: 'Montserrat-Light',
  bold: 'Montserrat-Bold',
  medium: 'Montserrat-Medium',
  semiBold: 'Montserrat-SemiBold',
  black: 'Montserrat-Black',
  thin: 'Montserrat-Thin',
};
const appTheme = { COLORS, SIZES, FONTS, IS_IOS, IS_IPHONE_X };

export default appTheme;
