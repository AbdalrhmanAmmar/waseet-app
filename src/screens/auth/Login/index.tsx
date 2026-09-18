import { loginRestriction, type LoginRestriction } from '@/auth/login-restriction';
import type { AccountReview } from '@/auth/account-review';
import type { ApiError } from '@/types/models';
import AccountStatusScreen from '@/screens/shared/AccountStatusScreen';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Text from '@/components/shared/CustomText';
import Images from '@/theme/images';
import { LoginField } from './LoginField';
import { loginColors as p, styles as s } from './styles';
import { useAppDispatch, useAppSelector } from '@/hooks/shared/use-store';
import { Login } from '@/store/slices/auth';
import { loginSchema } from '@/schemas/auth';
import { errorMessage } from '@/api/normalizers';
import type { ScreenProps } from '@/navigation/use-screen-props';
export default function LoginScreen({ navigation }: ScreenProps) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const submitting = useRef(false);
  const loading = useAppSelector((state) => state.AuthSlice.isLoading);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [restriction, setRestriction] = useState<{
    status: LoginRestriction;
    review?: AccountReview;
  } | null>(null);
  const { control, handleSubmit, resetField, setFocus } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = () =>
    handleSubmit(async (values) => {
      if (loading || submitting.current) return;
      submitting.current = true;
      setError('');
      try {
        await dispatch(Login(values)).unwrap();
      } catch (err) {
        const message = errorMessage(err);
        const review = (err as ApiError | null)?.accountReview;
        const status = loginRestriction(message, review?.accountStatus);
        if (status) {
          resetField('password');
          setVisible(false);
          setRestriction({ status, review });
        } else {
          setError(message);
        }
      } finally {
        submitting.current = false;
      }
    })();
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
    <ScreenContainer backgroundColor={p.background} edges={['top', 'left', 'right']}>
      <View
        style={s.decoration}
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={[
            s.orbit,
            {
              width: width * 1.5,
              height: width * 1.5,
              borderRadius: width,
              left: -width * 0.12,
              top: -width * 0.94,
            },
          ]}
        />
        <View
          style={[
            s.orbit,
            {
              width: width * 0.9,
              height: width * 0.9,
              borderRadius: width,
              right: -width * 0.52,
              top: -width * 0.67,
            },
          ]}
        />
        <View style={[s.node, { left: width * 0.14 - 8, top: width * 0.378 - 8 }]} />
        <View style={[s.node, { right: width * 0.24 - 8, top: width * 0.106 - 8 }]} />
      </View>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          testID="login-content"
          style={s.flex}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
        >
          <View style={s.content}>
            <View style={s.brand} accessible accessibilityLabel="وسيط">
              <Image source={Images.brandLogo} style={s.logo} resizeMode="contain" />
              <Text style={s.brandName}>وسيط</Text>
            </View>
            <View style={s.intro}>
              <Text accessibilityRole="header" style={s.title}>
                أهلًا بعودتك
              </Text>
              <Text style={s.subtitle}>سجّل دخولك لمتابعة أعمالك مع وسيط.</Text>
            </View>
            <View style={s.form}>
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <LoginField
                    inputRef={field.ref}
                    value={field.value}
                    onChangeText={(value) => {
                      setError('');
                      field.onChange(value);
                    }}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    label="البريد الإلكتروني"
                    icon="email-outline"
                    placeholder="أدخل بريدك الإلكتروني"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="username"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => setFocus('password')}
                    editable={!loading}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <LoginField
                    inputRef={field.ref}
                    value={field.value}
                    onChangeText={(value) => {
                      setError('');
                      field.onChange(value);
                    }}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    label="كلمة المرور"
                    icon="lock-outline"
                    placeholder="أدخل كلمة المرور"
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={submit}
                    editable={!loading}
                    trailing={
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        onPress={() => setVisible((value) => !value)}
                        style={({ pressed }) => [s.eye, pressed && s.pressed]}
                      >
                        <Icon
                          name={visible ? 'eye-off-outline' : 'eye-outline'}
                          color={p.muted}
                          size={23}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
              {!!error && (
                <View style={s.error}>
                  <Icon name="alert-circle-outline" color={p.danger} size={19} accessible={false} />
                  <Text accessibilityRole="alert" style={s.errorText}>
                    {error}
                  </Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تسجيل الدخول"
                accessibilityState={{ busy: loading, disabled: loading }}
                disabled={loading}
                onPress={submit}
                style={({ pressed }) => [s.primary, pressed && s.pressed]}
              >
                <View style={s.buttonIcon} />
                <Text style={s.primaryText}>{loading ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}</Text>
                <View style={s.buttonIcon}>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Icon name="arrow-left" size={25} color="#fff" />
                  )}
                </View>
              </Pressable>
            </View>
            <View style={s.signup}>
              <Text style={s.signupHint}>ليس لديك حساب؟</Text>
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => navigation.navigate('SignUp')}
                style={({ pressed }) => [s.secondary, pressed && s.pressed, loading && s.disabled]}
              >
                <Text style={s.secondaryText}>إنشاء حساب جديد</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
