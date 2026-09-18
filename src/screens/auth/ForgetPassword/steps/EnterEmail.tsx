import { CustomText, CustomTextInput } from '@/components/shared/index';
import { emailOnlySchema } from '@/schemas/auth';
import { ResetPasswordRequest } from '@/store/slices/auth';
import { COLORS, FONTS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { yupResolver } from '@hookform/resolvers/yup';
import React from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Animatable from '@/components/shared/Motion';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

const EnterEmail: React.FC<{ onNext: (email: string) => void; navigation: any }> = ({
  onNext,
  navigation,
}) => {
  const { isLoading } = useSelector((state: any) => state.AuthSlice);
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(emailOnlySchema),
    defaultValues: { email: '' },
  });
  const dispatch: any = useDispatch();

  const handleSendCode = async (data: { email: string }) => {
    try {
      await dispatch(ResetPasswordRequest(data)).unwrap();
      onNext(data.email);
    } catch (error) {
      Toast.show({ type: 'error', text1: String(error) });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animatable.View animation="slideInUp" duration={700} style={styles.card}>
        <View style={styles.cardIconBox}>
          <Icon name="lock-reset" size={hp(4)} color={COLORS.primary} />
        </View>
        <CustomText style={styles.title}>نسيت كلمة المرور؟</CustomText>
        <CustomText style={styles.subtitle}>
          أدخل بريدك الإلكتروني وسنرسل لك رمز OTP لإعادة تعيين كلمة المرور.
        </CustomText>

        <CustomTextInput
          control={control}
          name="email"
          label="البريد الإلكتروني"
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftComponent={
            <Icon name="email-outline" size={hp(2.5)} color="#757D85" style={{ marginRight: 8 }} />
          }
        />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSubmit(handleSendCode)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <CustomText style={styles.actionBtnText}>إرسال الرمز</CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomLink} onPress={() => navigation.goBack()}>
          <CustomText style={styles.bottomLinkHighlight}>الرجوع لتسجيل الدخول</CustomText>
        </TouchableOpacity>
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
    marginTop: hp(2),
    marginBottom: hp(3),
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  actionBtnText: { fontSize: hp(2.2), fontFamily: FONTS.fontFamilyBold, color: COLORS.white },

  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
  },
  bottomLinkHighlight: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
  },
});

export default EnterEmail;
