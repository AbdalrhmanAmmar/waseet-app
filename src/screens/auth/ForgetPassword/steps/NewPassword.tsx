import { errorMessage } from '@/api/normalizers';
import { authApi } from '@/api/shared/auth';
import { CustomText, CustomTextInput } from '@/components/shared/index';
import { COLORS, FONTS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

import { newPasswordSchema } from '@/schemas/auth';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useWatch } from 'react-hook-form';
import Toast from 'react-native-toast-message';

const NewPassword: React.FC<{ onNext: () => void; email: string; otp: string }> = ({
  onNext,
  email,
  otp,
}) => {
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const values = useWatch({ control });
  const password = values.password;
  const confirmPassword = values.confirmPassword;
  const isMatch = password && confirmPassword && password === confirmPassword;
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const handleReset = async (data: { password: string; confirmPassword: string }) => {
    if (saving) return;
    setSaving(true);
    try {
      await authApi.resetPassword({ email, otp, ...data });
      Toast.show({ type: 'success', text1: 'تم تحديث كلمة المرور بنجاح' });
      onNext();
    } catch (error) {
      Toast.show({ type: 'error', text1: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Animatable.View animation="slideInRight" duration={700} style={styles.card}>
        <View style={styles.cardIconBox}>
          <Icon name="lock-reset" size={hp(4)} color={COLORS.mainOrange} />
        </View>
        <CustomText style={styles.title}>كلمة مرور جديدة</CustomText>
        <CustomText style={styles.subtitle}>
          أنشئ كلمة مرور قوية لم تستخدمها من قبل لهذا الحساب.
        </CustomText>

        <CustomTextInput
          control={control}
          name="password"
          label="كلمة المرور الجديدة"
          placeholder="••••••••"
          secureTextEntry={!showPass}
          containerStyle={{ marginBottom: hp(2) }}
          leftComponent={
            <Icon name="lock-outline" size={hp(2.5)} color="#757D85" style={{ marginRight: 8 }} />
          }
          rightComponent={
            <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
              <Icon
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={hp(2.5)}
                color="#757D85"
              />
            </TouchableOpacity>
          }
        />

        <CustomTextInput
          control={control}
          name="confirmPassword"
          label="تأكيد كلمة المرور"
          placeholder="••••••••"
          secureTextEntry={!showConfirm}
          containerStyle={{ marginBottom: hp(1) }}
          leftComponent={
            <Icon
              name="lock-check-outline"
              size={hp(2.5)}
              color="#757D85"
              style={{ marginRight: 8 }}
            />
          }
          rightComponent={
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
              <Icon
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={hp(2.5)}
                color="#757D85"
              />
            </TouchableOpacity>
          }
        />

        {(confirmPassword?.length ?? 0) > 0 && (
          <Animatable.View animation="fadeIn" style={styles.matchRow}>
            <Icon
              name={isMatch ? 'check-circle' : 'close-circle'}
              size={hp(1.8)}
              color={isMatch ? '#22C55E' : '#EF4444'}
            />
            <CustomText style={[styles.matchText, { color: isMatch ? '#22C55E' : '#EF4444' }]}>
              {isMatch ? 'كلمات المرور متطابقة' : 'كلمات المرور غير متطابقة'}
            </CustomText>
          </Animatable.View>
        )}

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleSubmit(handleReset)}
          disabled={saving}
          activeOpacity={0.8}
        >
          <CustomText style={styles.actionBtnText}>تغيير كلمة المرور</CustomText>
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

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: hp(3) },
  matchText: { fontSize: hp(1.6), fontFamily: FONTS.fontFamilySemiBold },

  actionBtn: {
    backgroundColor: COLORS.mainOrange,
    borderRadius: hp(1.5),
    height: hp(7.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(3),
    shadowColor: COLORS.mainOrange,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  actionBtnText: { fontSize: hp(2.2), fontFamily: FONTS.fontFamilyBold, color: COLORS.white },
});

export default NewPassword;
