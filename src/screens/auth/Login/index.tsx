import { loginRestriction, type LoginRestriction } from '@/auth/login-restriction';
import type { AccountReview } from '@/auth/account-review';
import type { ApiError } from '@/types/models';
import AccountStatusScreen from '@/screens/shared/AccountStatusScreen';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import AuthLayout from '@/components/shared/AuthLayout';
import { CustomText as Text, CustomTextInput } from '@/components/shared';
import { Brand, Button, Card, ui } from '@/components/shared/ui';
import { palette as p, typography as t } from '@/theme/tokens';
import { useAppDispatch, useAppSelector } from '@/hooks/shared/use-store';
import { Login } from '@/store/slices/auth';
import { loginSchema } from '@/schemas/auth';
import { errorMessage } from '@/api/normalizers';
import type { ScreenProps } from '@/navigation/use-screen-props';
export default function LoginScreen({ navigation }: ScreenProps) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.AuthSlice.isLoading);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [restriction, setRestriction] = useState<{
    status: LoginRestriction;
    review?: AccountReview;
  } | null>(null);
  const { control, handleSubmit, resetField } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    if (loading) return;
    setError('');
    try {
      await dispatch(Login(values)).unwrap();
    } catch (err) {
      const message = errorMessage(err);
      const review = (err as ApiError | null)?.accountReview;
      const status = loginRestriction(message, review?.accountStatus);
      if (status) {
        resetField('password');
        setRestriction({ status, review });
      } else {
        setError(message);
      }
    }
  });
  if (restriction) {
    return (
      <AccountStatusScreen
        loginRestriction={restriction.status}
        loginReview={restriction.review}
        onRetryLogin={() => setRestriction(null)}
      />
    );
  }
  return (
    <AuthLayout header={<Brand compact />}>
      <View style={s.intro}>
        <View style={s.label}>
          <Icon name="hand-wave-outline" size={17} color={p.primary} />
          <Text style={ui.link}>أهلًا بعودتك</Text>
        </View>
        <Text style={s.title}>كل أعمالك،{'\n'}في مكان واحد.</Text>
        <Text style={s.subtitle}>سجّل دخولك وتابع منتجاتك وطلباتك مع وسيط.</Text>
      </View>
      <Card style={s.form}>
        <Text style={ui.title}>تسجيل الدخول</Text>
        <CustomTextInput
          control={control}
          name="email"
          label="البريد الإلكتروني"
          placeholder="أدخل بريدك الإلكتروني"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
        />
        <CustomTextInput
          control={control}
          name="password"
          label="كلمة المرور"
          placeholder="أدخل كلمة المرور"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
          rightComponent={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              onPress={() => setVisible(!visible)}
              style={s.eye}
            >
              <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} color={p.muted} size={22} />
            </Pressable>
          }
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ForgetPasswordFlow')}
          style={s.forgot}
        >
          <Text style={ui.link}>نسيت كلمة المرور؟</Text>
        </Pressable>
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        <Button title="تسجيل الدخول" onPress={submit} loading={loading} icon="arrow-left" />
      </Card>
      <View style={s.signup}>
        <Text style={ui.caption}>جديد على وسيط؟</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('SignUp')}>
          <Text style={ui.link}>إنشاء حساب جديد</Text>
        </Pressable>
      </View>
      <View style={s.note}>
        <Icon name="storefront-outline" size={18} color={p.muted} />
        <Text style={ui.caption}>للتجار وفرق المبيعات والإدارة والتوصيل</Text>
      </View>
    </AuthLayout>
  );
}
const s = StyleSheet.create({
  intro: { gap: 12, paddingTop: 18 },
  label: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  title: { fontFamily: t.bold, fontSize: 36, lineHeight: 48, color: p.deep },
  subtitle: { color: p.muted, fontSize: 16, lineHeight: 26 },
  form: { gap: 4, padding: 22 },
  eye: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  forgot: { alignSelf: 'flex-end', paddingVertical: 8, marginTop: -10, marginBottom: 12 },
  error: {
    color: p.danger,
    backgroundColor: '#FFF4F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  signup: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  note: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
