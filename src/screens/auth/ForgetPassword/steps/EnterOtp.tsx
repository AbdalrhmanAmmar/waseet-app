import { errorMessage } from '@/api/normalizers';
import { authApi } from '@/api/shared/auth';
import { CustomText, OTPInput } from '@/components/shared/index';
import { COLORS, FONTS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Animatable from '@/components/shared/Motion';

import Toast from 'react-native-toast-message';

const EnterOtp: React.FC<{ onNext: (otp: string) => void; email: string }> = ({
  onNext,
  email,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const handleVerify = async () => {
    if (isLoading) return;
    setLoading(true);
    try {
      const code = otp.join('');
      await authApi.verifyReset({ email, otp: code });
      onNext(code);
    } catch (error) {
      Toast.show({ type: 'error', text1: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  };
  const handleResend = async () => {
    if (timeLeft > 0 || isLoading) return;
    setLoading(true);
    try {
      await authApi.requestReset({ email });
      setTimeLeft(60);
      Toast.show({ type: 'success', text1: 'تم إرسال الرمز' });
    } catch (error) {
      Toast.show({ type: 'error', text1: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animatable.View animation="slideInRight" duration={700} style={styles.card}>
        <View style={styles.cardIconBox}>
          <Icon name="shield-check-outline" size={hp(4)} color={COLORS.primary} />
        </View>
        <CustomText style={styles.title}>التحقق من الرمز</CustomText>
        <CustomText style={styles.subtitle}>
          تم إرسال رمز مكون من 6 أرقام إلى بريدك الإلكتروني. يرجى إدخاله أدناه للتحقق.
        </CustomText>

        <OTPInput length={6} otp={otp} setOtp={setOtp} />

        <TouchableOpacity
          style={[styles.actionBtn, !isComplete && { opacity: 0.6 }]}
          onPress={handleVerify}
          disabled={!isComplete || isLoading}
          activeOpacity={0.8}
        >
          <CustomText style={styles.actionBtnText}>تحقق الآن</CustomText>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <CustomText style={styles.resendHint}>لم يصلك الرمز؟ </CustomText>
          <TouchableOpacity onPress={handleResend} disabled={timeLeft > 0}>
            <CustomText style={[styles.resendLink, timeLeft > 0 && { color: '#757D85' }]}>
              {timeLeft > 0 ? `إعادة الإرسال خلال ${timeLeft} ثانية` : 'إرسال الرمز مرة أخرى'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: hp(3), paddingBottom: hp(5), paddingTop: hp(2) },

  card: {
    padding: hp(1),
  },
  cardIconBox: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(2.5),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: hp(3.2),
    fontFamily: FONTS.fontFamilyBold,
    color: '#111A2C',
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#757D85',
    lineHeight: hp(2.5),
    marginBottom: hp(4),
  },

  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: hp(1.5),
    height: hp(7.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(4),
    marginBottom: hp(3),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  actionBtnText: { fontSize: hp(2.2), fontFamily: FONTS.fontFamilyBold, color: COLORS.white },

  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
  },
  resendHint: { fontSize: hp(1.6), fontFamily: FONTS.fontFamilyRegular, color: '#757D85' },
  resendLink: { fontSize: hp(1.6), fontFamily: FONTS.fontFamilyBold, color: COLORS.primary },
});

export default EnterOtp;
