import { CustomText, CustomTextInput } from '@/components/shared/index';
import { ScreenNames } from '@/navigation/ScreenNames';
import { loginSchema } from '@/schemas/auth';
import { styles } from '@/screens/auth/Login/styles';
import { Login } from '@/store/slices/auth';
import { COLORS, Images, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ImageBackground,
  Keyboard,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { isLoading } = useSelector((state: any) => state.AuthSlice);
  const dispatch: any = useDispatch();

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  const onLogin = (data: any) => {
    dispatch(Login(data))
      .unwrap()
      .then((res: any) => {
        if (res?.isSuccess) {
          // The root guard routes the authenticated session.
        } else {
          const message = res?.message || res?.title || 'فشل تسجيل الدخول';
          Toast.show({
            type: 'error',
            text1: message,
          });
        }
      })
      .catch((err: any) => {
        const errorMessage =
          typeof err === 'string'
            ? err
            : err?.message || err?.title || err?.data?.message || 'حدث خطأ في الاتصال بالخادم';
        Toast.show({
          type: 'error',
          text1: errorMessage,
        });
      });
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardOpen(true),
    );
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardOpen(false),
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <ImageBackground source={Images.auth_bg} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <ScrollView
          contentContainerStyle={[styles.scroll, isKeyboardOpen && styles.scrollKeyboard]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand / Logo */}
          <Animatable.View animation="fadeInDown" duration={800} style={styles.brand}>
            <View style={styles.logoCircle}>
              <Icon name="account" size={hp(4)} color={COLORS.mainOrange} />
            </View>
          </Animatable.View>

          {/* Content */}
          <Animatable.View animation="fadeInUp" duration={1000} style={styles.content}>
            <CustomText style={styles.title}>سجل الدخول</CustomText>
            <CustomText style={styles.subtitle}>مرحباً بك مجدداً، نود رؤيتك مرة أخرى</CustomText>

            {/* Email */}
            <CustomTextInput
              control={control}
              name="email"
              label="البريد الإلكتروني"
              placeholder="أدخل بريدك الإلكتروني"
              keyboardType="email-address"
              autoCapitalize="none"
              leftComponent={
                <Icon
                  name="email-outline"
                  size={hp(2.4)}
                  color="#757D85"
                  style={{ marginRight: 8 }}
                />
              }
            />

            {/* Password */}
            <CustomTextInput
              control={control}
              name="password"
              label="كلمة المرور"
              placeholder="أدخل كلمة المرور"
              secureTextEntry={!showPassword}
              leftComponent={
                <Icon
                  name="lock-outline"
                  size={hp(2.4)}
                  color="#757D85"
                  style={{ marginRight: 8 }}
                />
              }
              rightComponent={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Icon
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={hp(2.4)}
                    color="#757D85"
                  />
                </TouchableOpacity>
              }
            />

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="تسجيل الدخول"
              onPress={handleSubmit(onLogin)}
              disabled={isLoading}
              style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
            >
              <CustomText style={styles.loginBtnText}>
                {isLoading ? 'جاري التحميل...' : 'سجل الدخول'}
              </CustomText>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <CustomText style={styles.signupHint}>ليس لديك حساب؟ </CustomText>

              <TouchableOpacity
                onPress={() => navigation.navigate(ScreenNames.ForgetPasswordFlow)}
                style={{ padding: 12 }}
              >
                <CustomText>نسيت كلمة المرور؟</CustomText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate(ScreenNames.SignUp)}>
                <CustomText style={styles.signupLink}>إنشاء حساب جديد</CustomText>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
