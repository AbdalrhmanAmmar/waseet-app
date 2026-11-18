import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Image,
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Controller, useForm, useWatch, type FieldPath } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { InferType } from 'yup';
import AuthFormLayout from '@/components/auth/AuthFormLayout';
import {
  AuthButton,
  AuthNotice,
  AuthSelectField,
  FormAuthField,
  a,
} from '@/components/auth/AuthField';
import Text from '@/components/shared/CustomText';
import CountryPicker from '@/components/shared/CountryPicker';
import { palette as p } from '@/theme/tokens';
import Images from '@/theme/images';
import { PUBLIC_ROLES as ROLES, roleLabels, type PublicRole as Role } from '@/auth/roles';
import { countryFlag, registrationPhone } from '@/domain/auth-inputs';
import { signUpSchema } from '@/schemas/auth';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { errorMessage } from '@/api/normalizers';
import { SignUp } from '@/store/slices/auth';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { styles as s } from './styles';
type Values = InferType<typeof signUpSchema>;
const steps = ['بياناتك', 'التواصل', 'الأمان'];
const roleInfo: Record<
  Role,
  { icon: React.ComponentProps<typeof Icon>['name']; description: string }
> = {
  Merchant: { icon: 'storefront-outline', description: 'منتجاتك ومبيعاتك وأرباحك' },
  SalesEmployee: { icon: 'account-tie-outline', description: 'إنشاء الطلبات ومتابعة البيع' },
  ManagementEmployee: {
    icon: 'clipboard-check-outline',
    description: 'تنظيم الطلبات ومتابعة حالتها',
  },
  DeliveryAgent: { icon: 'truck-delivery-outline', description: 'استلام مهام التوصيل وتنفيذها' },
};
export default function SignUpScreen({ navigation }: ScreenProps) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>('Merchant');
  const [phoneCountry, setPhoneCountry] = useState('SY');
  const [residenceCountry, setResidenceCountry] = useState('SY');
  const [callingCode, setCallingCode] = useState('963');
  const [serverError, setServerError] = useState('');
  const [complete, setComplete] = useState(false);
  const [checking, setChecking] = useState(false);
  const [requestedFocus, setRequestedFocus] = useState<FieldPath<Values> | null>(null);
  const scroll = useRef<ScrollView>(null);
  const submitting = useRef(false);
  const advancing = useRef(false);
  const areas = useDeliveryAreasQuery(undefined, { skip: role !== 'DeliveryAgent' });
  const {
    control,
    trigger,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getFieldState,
    setFocus,
    formState: { isSubmitting },
  } = useForm<Values>({
    resolver: yupResolver(signUpSchema),
    context: { callingCode },
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    shouldFocusError: false,
    defaultValues: {
      firstName: '',
      secondName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      country: 'سوريا',
      city: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
  });
  const values = useWatch({ control });
  const busy = isSubmitting || checking;
  const fieldsForStep = (index: number): FieldPath<Values>[] =>
    index === 0
      ? ['firstName', 'secondName', 'lastName']
      : index === 1
        ? [
            'email',
            'phoneNumber',
            'country',
            ...(role === 'DeliveryAgent' ? ['city' as const] : []),
            'address',
          ]
        : ['password', 'confirmPassword'];
  const go = (nextStep: number, focus?: FieldPath<Values>) => {
    if (!focus) Keyboard.dismiss();
    setStep(nextStep);
    setServerError('');
    setRequestedFocus(focus ?? null);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  useEffect(() => {
    if (!requestedFocus || complete || busy) return;
    const frame = requestAnimationFrame(() => {
      setFocus(requestedFocus);
      setRequestedFocus(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [step, requestedFocus, complete, busy, setFocus]);
  useEffect(() => {
    if (!serverError) return;
    const frame = requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [serverError]);
  useEffect(() => {
    if (!step || complete) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!busy) {
        Keyboard.dismiss();
        setStep((current) => current - 1);
      }
      return true;
    });
    return () => subscription.remove();
  }, [step, complete, busy]);
  useEffect(() => {
    if (values.confirmPassword && getFieldState('confirmPassword').isTouched)
      void trigger('confirmPassword');
  }, [values.password, values.confirmPassword, getFieldState, trigger]);
  const next = async () => {
    if (advancing.current || busy) return;
    advancing.current = true;
    setChecking(true);
    try {
      const fields = fieldsForStep(step);
      const valid = await trigger(fields);
      const missingCity = step === 1 && role === 'DeliveryAgent' && !values.city?.trim();
      if (missingCity) setError('city', { message: 'اختر مدينة التوصيل أو أدخل اسمها' });
      const invalid = fields.find((name) => getFieldState(name).invalid);
      if (!valid || missingCity || invalid) {
        if (invalid) setRequestedFocus(invalid);
        return;
      }
      go(step + 1);
    } finally {
      advancing.current = false;
      setChecking(false);
    }
  };
  const submit = () =>
    handleSubmit(
      async (data) => {
        if (submitting.current) return;
        const phone = registrationPhone(data.phoneNumber, callingCode);
        if (phone.error) {
          go(1, 'phoneNumber');
          setError('phoneNumber', { message: phone.error });
          return;
        }
        if (role === 'DeliveryAgent' && !data.city?.trim()) {
          go(1, 'city');
          setError('city', { message: 'مدينة التوصيل مطلوبة' });
          return;
        }
        submitting.current = true;
        setServerError('');
        Keyboard.dismiss();
        try {
          const { confirmPassword: _confirmation, city, ...fields } = data;
          await dispatch(
            SignUp({
              ...fields,
              phoneNumber: phone.international,
              role,
              ...(role === 'DeliveryAgent' ? { city: city?.trim() } : {}),
            }),
          ).unwrap();
          setComplete(true);
        } catch (error) {
          setServerError(errorMessage(error));
        } finally {
          submitting.current = false;
        }
      },
      (invalid) => {
        const index = [0, 1, 2].find((candidate) =>
          fieldsForStep(candidate).some((field) => invalid[field]),
        );
        if (index !== undefined)
          go(
            index,
            fieldsForStep(index).find((field) => invalid[field]),
          );
      },
    )();
  const clearServerError = () => setServerError('');
  const contactNext = () => setFocus(role === 'DeliveryAgent' ? 'city' : 'address');
  const header = (
    <View style={s.header}>
      <View style={s.brand}>
        <Image source={Images.brandLogo} style={s.logo} />
        <Text style={s.brandName}>الوسيط الذكي</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="رجوع"
        disabled={busy}
        onPress={() => {
          if (busy) return;
          if (step) go(step - 1);
          else navigation.goBack();
        }}
        style={[s.back, busy && { opacity: 0.5 }]}
      >
        <Icon name="arrow-right" size={22} color={p.deep} />
      </Pressable>
    </View>
  );
  if (complete)
    return (
      <AuthFormLayout header={header} centered>
        <View style={s.successIcon}>
          <Icon name="check-decagram-outline" size={56} color={p.primary} />
        </View>
        <Text accessibilityRole="header" style={[s.title, { textAlign: 'center' }]}>
          أهلًا بك في الوسيط الذكي
        </Text>
        <Text style={[s.description, { textAlign: 'center' }]}>
          تم إنشاء حسابك بنجاح. سجّل الدخول للاطلاع على حالة الحساب وبدء استخدام التطبيق.
        </Text>
        <AuthButton title="تسجيل الدخول" onPress={() => navigation.replace('Login')} />
      </AuthFormLayout>
    );
  return (
    <AuthFormLayout
      scrollRef={scroll}
      testID="signup-content"
      header={header}
      footer={
        <View style={{ gap: 8 }}>
          <View style={s.footerRow}>
            <View style={{ flex: 1 }}>
              <AuthButton
                title={step === 2 ? 'إنشاء الحساب' : 'متابعة'}
                onPress={step === 2 ? submit : next}
                loading={isSubmitting}
                disabled={checking}
                loadingText="جارٍ إنشاء الحساب…"
              />
            </View>
            {step > 0 && (
              <AuthButton title="السابق" secondary disabled={busy} onPress={() => go(step - 1)} />
            )}
          </View>
          <Text style={s.footerCaption}>
            الخطوة {step + 1} من ٣ · {steps[step]}
          </Text>
        </View>
      }
    >
      <View style={{ gap: 5 }}>
        <Text accessibilityRole="header" style={s.title}>
          {['إنشاء حساب جديد', 'بيانات التواصل', 'أمان حسابك'][step]}
        </Text>
        <Text style={s.description}>
          {
            [
              'اختر نوع حسابك وأدخل بياناتك الشخصية.',
              'أضف وسائل التواصل وعنوان إقامتك.',
              'راجع بياناتك واختر كلمة مرور لحسابك.',
            ][step]
          }
        </Text>
      </View>
      <View style={s.steps}>
        {steps.map((label, index) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={'خطوة ' + label}
            accessibilityState={{ selected: step === index, disabled: index >= step || busy }}
            disabled={index >= step || busy}
            onPress={() => go(index)}
            style={s.step}
          >
            <View style={[s.stepCircle, index <= step && s.activeStep]}>
              {index < step ? (
                <Icon name="check" size={14} color="#fff" />
              ) : (
                <Text style={[s.stepNumber, index <= step && { color: '#fff' }]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[s.stepLabel, index === step && s.activeStepLabel]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {step === 0 && (
        <>
          <View style={{ gap: 10 }}>
            <Text style={s.sectionTitle}>نوع الحساب</Text>
            <View style={s.roles}>
              {ROLES.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityLabel={roleLabels[item]}
                  accessibilityHint={roleInfo[item].description}
                  accessibilityState={{ checked: role === item, disabled: busy }}
                  disabled={busy}
                  onPress={() => {
                    setRole(item);
                    clearErrors('city');
                  }}
                  style={[s.role, role === item && s.roleSelected]}
                >
                  <View style={s.roleIcon}>
                    <Icon
                      name={roleInfo[item].icon}
                      size={23}
                      color={role === item ? p.primary : p.muted}
                    />
                    {role === item && <Icon name="check-circle" size={15} color={p.primary} />}
                  </View>
                  <Text style={[s.roleTitle, role === item && { color: p.primary }]}>
                    {roleLabels[item]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={a.card}>
            <FormAuthField
              control={control}
              name="firstName"
              label="الاسم الأول"
              placeholder="الاسم الأول"
              icon="account-outline"
              autoComplete="given-name"
              editable={!busy}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('secondName')}
              onValueChange={clearServerError}
            />
            <FormAuthField
              control={control}
              name="secondName"
              label="الاسم الثاني"
              placeholder="الاسم الثاني"
              icon="account-outline"
              autoComplete="additional-name"
              editable={!busy}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('lastName')}
              onValueChange={clearServerError}
            />
            <FormAuthField
              control={control}
              name="lastName"
              label="اسم العائلة"
              placeholder="اسم العائلة"
              icon="account-outline"
              autoComplete="family-name"
              editable={!busy}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={next}
              onValueChange={clearServerError}
            />
          </View>
        </>
      )}
      {step === 1 && (
        <View style={a.card}>
          <FormAuthField
            control={control}
            name="email"
            label="البريد الإلكتروني"
            placeholder="example@mail.com"
            icon="email-outline"
            direction="ltr"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="email"
            editable={!busy}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => setFocus('phoneNumber')}
            onValueChange={clearServerError}
          />
          <FormAuthField
            control={control}
            name="phoneNumber"
            label="رقم الهاتف"
            placeholder="أدخل رقم الهاتف"
            icon="phone-outline"
            direction="ltr"
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoComplete="tel"
            autoCorrect={false}
            spellCheck={false}
            editable={!busy}
            returnKeyType="next"
            submitBehavior="submit"
            inputAccessoryViewID={Platform.OS === 'ios' ? 'auth-signup-phone-toolbar' : undefined}
            onSubmitEditing={contactNext}
            onValueChange={clearServerError}
            hint="كود الدولة يخص رقم الهاتف، ويمكنك لصق رقمك الدولي كاملًا."
            trailing={
              <CountryPicker
                countryCode={phoneCountry}
                title="كود دولة رقم الهاتف"
                callingCodesOnly
                disabled={busy}
                onSelect={(country) => {
                  setPhoneCountry(country.cca2);
                  setCallingCode(country.callingCode[0]);
                  clearServerError();
                  requestAnimationFrame(() => {
                    if (getFieldState('phoneNumber').isTouched) void trigger('phoneNumber');
                  });
                }}
                renderTrigger={(open) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={'كود دولة رقم الهاتف: +' + callingCode}
                    disabled={busy}
                    onPress={open}
                    style={s.dial}
                  >
                    <Text accessible={false} style={s.flag}>
                      {countryFlag(phoneCountry)}
                    </Text>
                    <Text style={s.callingCode}>+{callingCode}</Text>
                    <Icon name="chevron-down" size={18} color={p.muted} />
                  </Pressable>
                )}
              />
            }
          />
          <Controller
            control={control}
            name="country"
            render={({ field, fieldState }) => (
              <CountryPicker
                countryCode={residenceCountry}
                title="بلد الإقامة"
                disabled={busy}
                onSelect={(country) => {
                  setResidenceCountry(country.cca2);
                  field.onChange(country.name);
                  field.onBlur();
                  clearServerError();
                }}
                renderTrigger={(open) => (
                  <AuthSelectField
                    label="بلد الإقامة"
                    value={field.value}
                    disabled={busy}
                    onPress={open}
                    error={fieldState.error?.message}
                  />
                )}
              />
            )}
          />
          {role === 'DeliveryAgent' && (
            <>
              <FormAuthField
                control={control}
                name="city"
                label="مدينة التوصيل"
                placeholder="أدخل المدينة"
                icon="map-marker-outline"
                editable={!busy}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => setFocus('address')}
                onValueChange={clearServerError}
              />
              {areas.isLoading && <Text style={s.caption}>جارٍ تحميل مدن التوصيل…</Text>}
              {!!areas.data?.length && (
                <View style={s.cities}>
                  {areas.data.map((area) => (
                    <Pressable
                      key={area.deliveryAreaId}
                      accessibilityRole="button"
                      accessibilityLabel={area.city}
                      disabled={busy}
                      onPress={() => setValue('city', area.city, { shouldValidate: true })}
                      style={[s.city, values.city === area.city && { backgroundColor: p.soft }]}
                    >
                      <Text style={s.link}>{area.city}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {areas.isError && <Text style={s.caption}>يمكنك كتابة اسم المدينة يدويًا.</Text>}
            </>
          )}
          <FormAuthField
            control={control}
            name="address"
            label="العنوان بالتفصيل"
            placeholder="المنطقة، الشارع، البناء"
            icon="map-marker-outline"
            multiline
            autoComplete="street-address"
            editable={!busy}
            onValueChange={clearServerError}
          />
          {Platform.OS === 'ios' && (
            <InputAccessoryView nativeID="auth-signup-phone-toolbar">
              <View style={s.keyboardToolbar}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="التالي بعد رقم الهاتف"
                  disabled={busy}
                  onPress={contactNext}
                  style={s.keyboardAction}
                >
                  <Text style={s.link}>التالي</Text>
                  <Icon name="arrow-left" size={19} color={p.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => Keyboard.dismiss()}
                  style={s.keyboardAction}
                >
                  <Text style={s.link}>تم</Text>
                </Pressable>
              </View>
            </InputAccessoryView>
          )}
        </View>
      )}
      {step === 2 && (
        <>
          <View style={[a.card, { backgroundColor: p.soft }]}>
            <View style={s.summaryTop}>
              <Text style={s.sectionTitle}>ملخص حسابك</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تعديل البيانات الشخصية"
                disabled={busy}
                onPress={() => go(0)}
                style={s.summaryAction}
              >
                <Icon name="pencil-outline" size={18} color={p.primary} />
                <Text style={s.link}>تعديل البيانات</Text>
              </Pressable>
            </View>
            <Text style={s.summaryName}>
              {values.firstName} {values.lastName} · {roleLabels[role]}
            </Text>
            <View style={s.summaryTop}>
              <Text style={s.email}>{values.email}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تعديل بيانات التواصل"
                disabled={busy}
                onPress={() => go(1)}
                style={s.summaryAction}
              >
                <Text style={s.link}>تعديل</Text>
              </Pressable>
            </View>
            <Text style={s.caption}>
              {values.country}
              {role === 'DeliveryAgent' && values.city ? '، ' + values.city : ''}
            </Text>
          </View>
          <View style={a.card}>
            <FormAuthField
              control={control}
              name="password"
              label="كلمة المرور"
              placeholder="8 أحرف على الأقل"
              icon="lock-outline"
              password
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="new-password"
              editable={!busy}
              hint="٨ أحرف على الأقل. استخدم كلمة مرور طويلة يصعب تخمينها."
              success={(values.password?.length ?? 0) >= 8 ? '٨ أحرف على الأقل' : undefined}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('confirmPassword')}
              onValueChange={clearServerError}
            />
            <FormAuthField
              control={control}
              name="confirmPassword"
              label="تأكيد كلمة المرور"
              placeholder="أعد كتابة كلمة المرور"
              icon="lock-check-outline"
              password
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="new-password"
              editable={!busy}
              success={
                !!values.confirmPassword && values.password === values.confirmPassword
                  ? 'كلمتا المرور متطابقتان'
                  : undefined
              }
              returnKeyType="go"
              onSubmitEditing={submit}
              onValueChange={clearServerError}
            />
          </View>
        </>
      )}
      {!!serverError && <AuthNotice message={serverError} />}
      <View style={s.login}>
        <Text style={s.caption}>لديك حساب بالفعل؟</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="تسجيل الدخول"
          disabled={busy}
          onPress={() => navigation.navigate('Login')}
          style={s.summaryAction}
        >
          <Text style={s.link}>تسجيل الدخول</Text>
        </Pressable>
      </View>
    </AuthFormLayout>
  );
}
