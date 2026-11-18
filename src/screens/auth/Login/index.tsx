import { loginRestriction, type LoginRestriction } from '@/auth/login-restriction';
import type { AccountReview } from '@/auth/account-review';
import type { ApiError } from '@/types/models';
import AccountStatusScreen from '@/screens/shared/AccountStatusScreen';
import { useRef, useState } from 'react';
import { Image, Keyboard, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Text from '@/components/shared/CustomText';
import Images from '@/theme/images';
import AuthFormLayout from '@/components/auth/AuthFormLayout';
import { AuthButton, AuthNotice, FormAuthField, a } from '@/components/auth/AuthField';
import { styles as s } from './styles';
import { useAppDispatch, useAppSelector } from '@/hooks/shared/use-store';
import { Login } from '@/store/slices/auth';
import { loginSchema } from '@/schemas/auth';
import { errorMessage } from '@/api/normalizers';
import type { ScreenProps } from '@/navigation/use-screen-props';
export default function LoginScreen({ navigation }: ScreenProps) {
  const dispatch = useAppDispatch();
  const submitting = useRef(false);
  const loading = useAppSelector((state) => state.AuthSlice.isLoading);
  const [error, setError] = useState('');
  const [restriction, setRestriction] = useState<{
    status: LoginRestriction;
    review?: AccountReview;
  } | null>(null);
  const { control, handleSubmit, resetField, setFocus } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });
  const submit = () =>
    handleSubmit(async (values) => {
      if (loading || submitting.current) return;
      submitting.current = true;
      setError('');
      Keyboard.dismiss();
      try {
        await dispatch(Login(values)).unwrap();
      } catch (err) {
        const message = errorMessage(err);
        const review = (err as ApiError | null)?.accountReview;
        const status = loginRestriction(message, review?.accountStatus);
        if (status) {
          resetField('password');
          setRestriction({ status, review });
        } else setError(message);
      } finally {
        submitting.current = false;
      }
    })();
  if (restriction)
    return (
      <AccountStatusScreen
        loginRestriction={restriction.status}
        loginReview={restriction.review}
        onRetryLogin={() => setRestriction(null)}
      />
    );
  return (
    <AuthFormLayout centered testID="login-content">
      <View style={s.brand} accessible accessibilityLabel="الوسيط الذكي">
        <Image source={Images.brandLogo} style={s.logo} resizeMode="contain" />
        <Text style={s.brandName}>الوسيط الذكي</Text>
      </View>
      <View style={s.intro}>
        <Text accessibilityRole="header" style={s.title}>
          أهلًا بعودتك
        </Text>
        <Text style={s.subtitle}>سجّل دخولك لمتابعة أعمالك مع الوسيط الذكي.</Text>
      </View>
      <View style={[a.card, { gap: 12 }]}>
        <FormAuthField
          control={control}
          name="email"
          label="البريد الإلكتروني"
          icon="email-outline"
          direction="ltr"
          placeholder="أدخل بريدك الإلكتروني"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('password')}
          editable={!loading}
          onValueChange={() => setError('')}
        />
        <FormAuthField
          control={control}
          name="password"
          label="كلمة المرور"
          icon="lock-outline"
          password
          placeholder="أدخل كلمة المرور"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!loading}
          onValueChange={() => setError('')}
        />
        {!!error && <AuthNotice message={error} />}
        <AuthButton
          title="تسجيل الدخول"
          loading={loading}
          loadingText="جارٍ تسجيل الدخول…"
          onPress={submit}
        />
      </View>
      <View style={s.signup}>
        <Text style={s.signupHint}>ليس لديك حساب؟</Text>
        <AuthButton
          title="إنشاء حساب جديد"
          secondary
          disabled={loading}
          onPress={() => navigation.navigate('SignUp')}
        />
      </View>
      <Text style={s.caption}>الوسيط الذكي · تفاصيل أقل، إنجاز أكثر</Text>
    </AuthFormLayout>
  );
}
