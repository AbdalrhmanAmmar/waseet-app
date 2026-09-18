import CustomText from '@/components/shared/CustomText/index';
import LinearGradient from '@/components/shared/LinearGradient';
import { COLORS, FONTS, hp, wp } from '@/theme/index';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import type { ToastConfig } from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary, COLORS.primary100]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.toastGradient}
      >
        <View style={styles.toastContent}>
          <View style={[styles.iconContainer, styles.successIconContainer]}>
            <Ionicons name="checkmark-circle" size={hp(3.5)} color={COLORS.white} />
          </View>
          <View style={styles.textContainer}>
            <CustomText style={styles.text1}>{text1}</CustomText>
            {text2 && <CustomText style={styles.text2}>{text2}</CustomText>}
          </View>
        </View>
      </LinearGradient>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={['#F14D4D', '#FF6B6B', '#F14D4D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.toastGradient}
      >
        <View style={styles.toastContent}>
          <View style={styles.textContainer}>
            <CustomText style={styles.text1}>{text1}</CustomText>
            {text2 && <CustomText style={styles.text2}>{text2}</CustomText>}
          </View>
          <View style={[styles.iconContainer, styles.errorIconContainer]}>
            <Ionicons name="close-circle" size={hp(3.5)} color={COLORS.white} />
          </View>
        </View>
      </LinearGradient>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={['#4FACFE', '#00C9FF', '#4FACFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.toastGradient}
      >
        <View style={styles.toastContent}>
          <View style={styles.textContainer}>
            <CustomText style={styles.text1}>{text1}</CustomText>
            {text2 && <CustomText style={styles.text2}>{text2}</CustomText>}
          </View>
          <View style={[styles.iconContainer, styles.infoIconContainer]}>
            <Ionicons name="information-circle" size={hp(3.5)} color={COLORS.white} />
          </View>
        </View>
      </LinearGradient>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    minHeight: hp(9),
    width: '92%',
    borderRadius: wp(5),
    overflow: 'hidden',
    ...COLORS.shadow,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toastGradient: {
    flex: 1,
    borderRadius: wp(5),
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4.5),
    paddingVertical: hp(1.8),
  },
  iconContainer: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(2),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  successIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  errorIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  infoIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  textContainer: {
    flex: 1,
    paddingLeft: wp(2),
  },
  text1: {
    fontSize: hp(1.7),
    color: COLORS.white,
    fontFamily: FONTS.fontFamilyBold,
    marginBottom: hp(0.4),
  },
  text2: {
    fontSize: hp(1.6),
    color: COLORS.white,
    opacity: 0.95,
    fontFamily: FONTS.fontFamilyRegular,
    lineHeight: hp(2.2),
  },
});
