import { useEffect, useRef, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { Picker } from '@react-native-picker/picker';
import { useForm, useWatch, type FieldPath } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { InferType } from 'yup';
import AuthLayout from '@/components/shared/AuthLayout';
import { CustomText as Text, CustomTextInput } from '@/components/shared';
import CountryPicker from '@/components/shared/CountryPicker';
import { Brand, Button, Card, ui } from '@/components/shared/ui';
import { AsyncState } from '@/components/shared/AsyncState';
import { palette as p, typography as t } from '@/theme/tokens';
import { ROLES, roleLabels, type Role } from '@/auth/roles';
import { signUpSchema } from '@/schemas/auth';
import { birthDateFromParts } from '@/schemas/birth-date';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { errorMessage } from '@/api/normalizers';
import { SignUp } from '@/store/slices/auth';
import type { ScreenProps } from '@/navigation/use-screen-props';
type Values = InferType<typeof signUpSchema>;
const steps = ['الحساب', 'التواصل', 'التأكيد'];
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
const stepFields: FieldPath<Values>[][] = [
  ['firstName', 'secondName', 'lastName', 'birthDate'],
  ['email', 'phoneNumber', 'country', 'address'],
  ['password', 'confirmPassword'],
];
export default function SignUpScreen({ navigation }: ScreenProps) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>('Merchant');
  const [countryCode, setCountryCode] = useState('SY');
  const [callingCode, setCallingCode] = useState('963');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateParts, setDateParts] = useState({
    day: 1,
    month: 1,
    year: new Date().getFullYear() - 20,
  });
  const [dateError, setDateError] = useState('');
  const [serverError, setServerError] = useState('');
  const [complete, setComplete] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const submitting = useRef(false);
  const areas = useDeliveryAreasQuery(undefined, { skip: role !== 'DeliveryAgent' });
  const {
    control,
    trigger,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: yupResolver(signUpSchema),
    mode: 'onTouched',
    shouldUnregister: false,
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
      birthDate: '',
    },
  });
  const values = useWatch({ control });
  const go = (next: number) => {
    setStep(next);
    setServerError('');
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  useEffect(() => {
    if (!step || complete) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep((value) => value - 1);
      return true;
    });
    return () => sub.remove();
  }, [step, complete]);
  const next = async () => {
    const valid = await trigger(stepFields[step], { shouldFocus: true });
    if (step === 1 && role === 'DeliveryAgent' && !values.city?.trim()) {
      setError('city', { message: 'اختر مدينة التوصيل أو أدخل اسمها' });
      return;
    }
    if (valid) go(step + 1);
    else if (step === 0 && !values.birthDate) scroll.current?.scrollToEnd({ animated: false });
  };
  const submit = () =>
    handleSubmit(
      async (data) => {
        if (submitting.current) return;
        if (role === 'DeliveryAgent' && !data.city?.trim()) {
          go(1);
          setError('city', { message: 'مدينة التوصيل مطلوبة' });
          return;
        }
        submitting.current = true;
        setServerError('');
        try {
          const { confirmPassword: _confirmation, city, ...fields } = data;
          await dispatch(
            SignUp({
              ...fields,
              phoneNumber: `+${callingCode}${data.phoneNumber}`,
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
        const first = stepFields.findIndex((fields) => fields.some((field) => invalid[field]));
        if (first >= 0) go(first);
      },
    )();
  const confirmDate = () => {
    const value = birthDateFromParts(dateParts.day, dateParts.month, dateParts.year);
    if (!value) {
      setDateError('التاريخ غير صحيح أو يقع في المستقبل. راجع اليوم والشهر والسنة.');
      return;
    }
    setValue('birthDate', value, { shouldValidate: true, shouldDirty: true });
    setDateOpen(false);
    setDateError('');
  };
  const eye = (visible: boolean, toggle: () => void, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${visible ? 'إخفاء' : 'إظهار'} ${label}`}
      onPress={toggle}
      style={s.eye}
    >
      <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={p.muted} />
    </Pressable>
  );
  if (complete)
    return (
      <AuthLayout header={<Brand compact />}>
        <View style={s.successIcon}>
          <Icon name="check-decagram-outline" size={58} color={p.primary} />
        </View>
        <Text style={s.title}>أهلًا بك في وسيط</Text>
        <Text style={s.description}>
          تم إنشاء حسابك بنجاح. سجّل الدخول للاطلاع على حالة الحساب وبدء استخدام التطبيق.
        </Text>
        <Button
          title="تسجيل الدخول"
          onPress={() => navigation.replace('Login')}
          icon="arrow-left"
        />
      </AuthLayout>
    );
  return (
    <AuthLayout
      scrollRef={scroll}
      header={
        <View style={s.header}>
          <Brand compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            onPress={() => (step ? go(step - 1) : navigation.goBack())}
            style={s.back}
          >
            <Icon name="arrow-right" size={22} color={p.ink} />
          </Pressable>
        </View>
      }
      footer={
        <>
          <View style={s.footerRow}>
            <Button
              style={{ flex: 1 }}
              title={step === 2 ? 'إنشاء الحساب' : 'متابعة'}
              onPress={step === 2 ? submit : next}
              loading={isSubmitting}
              icon="arrow-left"
            />
            {step > 0 && (
              <Button
                title="السابق"
                secondary
                disabled={isSubmitting}
                onPress={() => go(step - 1)}
              />
            )}
          </View>
          <Text style={[ui.caption, { textAlign: 'center' }]}>
            الخطوة {step + 1} من 3 · {steps[step]}
          </Text>
        </>
      }
    >
      <View>
        <Text style={s.eyebrow}>بداية جديدة لأعمالك</Text>
        <Text style={s.title}>إنشاء حساب جديد</Text>
        <Text style={s.description}>
          {
            [
              'اختر نوع حسابك وأخبرنا قليلًا عنك.',
              'كيف يمكننا التواصل معك؟',
              'راجع بياناتك واختر كلمة مرور لحسابك.',
            ][step]
          }
        </Text>
      </View>
      <View style={s.steps}>
        {steps.map((label, index) => (
          <View key={label} style={s.step}>
            <View style={[s.stepLine, index <= step && { backgroundColor: p.primary }]} />
            <Text style={[s.stepLabel, index === step && { color: p.primary, fontFamily: t.bold }]}>
              {index + 1}. {label}
            </Text>
          </View>
        ))}
      </View>
      {step === 0 && (
        <>
          <View style={{ gap: 12 }}>
            <Text style={s.sectionTitle}>نوع الحساب</Text>
            <View style={s.roles}>
              {ROLES.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: role === item }}
                  accessibilityLabel={roleLabels[item]}
                  onPress={() => {
                    setRole(item);
                    clearErrors('city');
                  }}
                  style={[s.role, role === item && s.roleSelected]}
                >
                  <View style={s.roleTop}>
                    <Icon
                      name={roleInfo[item].icon}
                      size={25}
                      color={role === item ? p.primary : p.muted}
                    />
                    {role === item && <Icon name="check-circle" size={18} color={p.primary} />}
                  </View>
                  <Text style={s.roleTitle}>{roleLabels[item]}</Text>
                  <Text style={s.roleDescription}>{roleInfo[item].description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Card>
            <Text style={s.sectionTitle}>البيانات الشخصية</Text>
            <CustomTextInput
              control={control}
              name="firstName"
              label="الاسم الأول"
              placeholder="الاسم الأول"
              autoComplete="given-name"
            />
            <CustomTextInput
              control={control}
              name="secondName"
              label="الاسم الثاني"
              placeholder="الاسم الثاني"
            />
            <CustomTextInput
              control={control}
              name="lastName"
              label="اسم العائلة"
              placeholder="اسم العائلة"
              autoComplete="family-name"
            />
            <Text style={s.fieldLabel}>تاريخ الميلاد</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="اختيار تاريخ الميلاد"
              onPress={() => setDateOpen(true)}
              style={[s.dateField, !!errors.birthDate && { borderColor: p.danger }]}
            >
              <Text style={{ color: values.birthDate ? p.ink : p.muted }}>
                {values.birthDate
                  ? new Date(values.birthDate).toLocaleDateString('ar-EG', { timeZone: 'UTC' })
                  : 'اختر تاريخ ميلادك'}
              </Text>
              <Icon name="calendar-outline" size={22} color={p.primary} />
            </Pressable>
            {errors.birthDate && (
              <Text accessibilityRole="alert" style={s.error}>
                {errors.birthDate.message}
              </Text>
            )}
          </Card>
        </>
      )}
      {step === 1 && (
        <Card>
          <Text style={s.sectionTitle}>بيانات التواصل والموقع</Text>
          <CustomTextInput
            control={control}
            name="email"
            label="البريد الإلكتروني"
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <CustomTextInput
            control={control}
            name="phoneNumber"
            label="رقم الهاتف"
            placeholder="أدخل رقم الهاتف"
            keyboardType="phone-pad"
            autoComplete="tel-national"
            leftComponent={
              <View style={s.dial}>
                <CountryPicker
                  countryCode={countryCode}
                  onSelect={(country) => {
                    setCountryCode(country.cca2);
                    setCallingCode(country.callingCode[0]);
                  }}
                />
                <Text style={ui.caption}>+{callingCode}</Text>
              </View>
            }
          />
          <CustomTextInput
            control={control}
            name="country"
            label="الدولة"
            placeholder="الدولة"
            rightComponent={
              <CountryPicker
                countryCode={countryCode}
                onSelect={(country) => setValue('country', country.name, { shouldValidate: true })}
              />
            }
          />
          {role === 'DeliveryAgent' && (
            <>
              <CustomTextInput
                control={control}
                name="city"
                label="مدينة التوصيل"
                placeholder="أدخل المدينة"
              />
              <AsyncState loading={areas.isLoading} />
              {!!areas.data?.length && (
                <View style={s.cities}>
                  {areas.data.map((area) => (
                    <Pressable
                      key={area.deliveryAreaId}
                      accessibilityRole="button"
                      onPress={() => setValue('city', area.city, { shouldValidate: true })}
                      style={[s.city, values.city === area.city && { backgroundColor: p.soft }]}
                    >
                      <Text style={ui.link}>{area.city}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {areas.isError && <Text style={ui.caption}>يمكنك كتابة اسم المدينة يدويًا.</Text>}
            </>
          )}
          <CustomTextInput
            control={control}
            name="address"
            label="العنوان بالتفصيل"
            placeholder="المنطقة، الشارع، البناء"
            multiline
            autoComplete="street-address"
          />
        </Card>
      )}
      {step === 2 && (
        <>
          <Card style={{ backgroundColor: p.soft }}>
            <View style={ui.section}>
              <Text style={s.sectionTitle}>ملخص حسابك</Text>
              <Pressable accessibilityRole="button" onPress={() => go(0)}>
                <Text style={ui.link}>تعديل</Text>
              </Pressable>
            </View>
            <Text>
              {values.firstName} {values.lastName} · {roleLabels[role]}
            </Text>
            <Text style={{ writingDirection: 'ltr', textAlign: 'right' }}>{values.email}</Text>
            <Text>
              {values.country}
              {values.city ? `، ${values.city}` : ''}
            </Text>
          </Card>
          <Card>
            <Text style={s.sectionTitle}>أمان الحساب</Text>
            <CustomTextInput
              control={control}
              name="password"
              label="كلمة المرور"
              placeholder="8 أحرف على الأقل"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              footerText="استخدم كلمة مرور طويلة يصعب تخمينها."
              rightComponent={eye(
                showPassword,
                () => setShowPassword(!showPassword),
                'كلمة المرور',
              )}
            />
            <CustomTextInput
              control={control}
              name="confirmPassword"
              label="تأكيد كلمة المرور"
              placeholder="أعد كتابة كلمة المرور"
              secureTextEntry={!showConfirmation}
              autoCapitalize="none"
              autoComplete="new-password"
              rightComponent={eye(
                showConfirmation,
                () => setShowConfirmation(!showConfirmation),
                'تأكيد كلمة المرور',
              )}
            />
          </Card>
        </>
      )}
      {!!serverError && (
        <Text accessibilityRole="alert" style={s.serverError}>
          {serverError}
        </Text>
      )}
      <View style={s.login}>
        <Text style={ui.caption}>لديك حساب بالفعل؟</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Login')}>
          <Text style={ui.link}>تسجيل الدخول</Text>
        </Pressable>
      </View>
      <Modal
        visible={dateOpen}
        animationType={reducedMotion ? 'none' : 'fade'}
        transparent
        onRequestClose={() => setDateOpen(false)}
      >
        <View style={s.modal}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <ScrollView contentContainerStyle={{ gap: 16 }}>
              <Text style={s.sectionTitle}>تاريخ الميلاد</Text>
              <Text style={ui.caption}>اختر اليوم والشهر والسنة</Text>
              <View style={s.pickers}>
                {(['day', 'month', 'year'] as const).map((part, index) => (
                  <View key={part} style={{ flex: 1 }}>
                    <Text style={{ textAlign: 'center' }}>
                      {['اليوم', 'الشهر', 'السنة'][index]}
                    </Text>
                    <Picker
                      accessibilityLabel={['اليوم', 'الشهر', 'السنة'][index]}
                      selectedValue={dateParts[part]}
                      onValueChange={(value) =>
                        setDateParts((previous) => ({ ...previous, [part]: Number(value) }))
                      }
                    >
                      {Array.from(
                        {
                          length:
                            part === 'year'
                              ? new Date().getFullYear() - 1899
                              : part === 'month'
                                ? 12
                                : 31,
                        },
                        (_, i) => (part === 'year' ? new Date().getFullYear() - i : i + 1),
                      ).map((value) => (
                        <Picker.Item key={value} label={String(value)} value={value} />
                      ))}
                    </Picker>
                  </View>
                ))}
              </View>
              {!!dateError && (
                <Text accessibilityRole="alert" style={s.error}>
                  {dateError}
                </Text>
              )}
              <Button title="تأكيد التاريخ" onPress={confirmDate} />
              <Button title="إلغاء" secondary onPress={() => setDateOpen(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AuthLayout>
  );
}
const s = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 44,
    height: 44,
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: p.primary, fontFamily: t.medium, fontSize: 13, marginBottom: 8 },
  title: { fontFamily: t.bold, fontSize: 29, lineHeight: 40 },
  description: { color: p.muted, fontSize: 15, marginTop: 8 },
  steps: { flexDirection: 'row-reverse', gap: 8 },
  step: { flex: 1, gap: 8 },
  stepLine: { height: 4, borderRadius: 4, backgroundColor: p.border },
  stepLabel: { color: p.muted, fontSize: 13 },
  sectionTitle: { fontSize: 18, fontFamily: t.bold },
  roles: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  role: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
    gap: 5,
  },
  roleSelected: { backgroundColor: p.soft, borderColor: p.primary },
  roleTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  roleTitle: { fontSize: 16, fontFamily: t.bold },
  roleDescription: { fontSize: 12, lineHeight: 20, color: p.muted },
  footerRow: { flexDirection: 'row-reverse', gap: 10 },
  fieldLabel: { fontSize: 14, fontFamily: t.medium },
  dateField: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 14,
    minHeight: 54,
  },
  error: { color: p.danger, fontSize: 13 },
  serverError: { color: p.danger, backgroundColor: '#FFF1EF', padding: 16, borderRadius: 14 },
  eye: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dial: { flexDirection: 'row', alignItems: 'center' },
  cities: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  city: { padding: 10, borderWidth: 1, borderColor: p.border, borderRadius: 10 },
  login: { flexDirection: 'row-reverse', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  modal: { flex: 1, backgroundColor: '#10291F88', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: p.surface,
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  pickers: { flexDirection: 'row-reverse', gap: 4 },
  successIcon: {
    alignSelf: 'center',
    padding: 32,
    borderRadius: 100,
    backgroundColor: p.soft,
    marginTop: 48,
  },
});
