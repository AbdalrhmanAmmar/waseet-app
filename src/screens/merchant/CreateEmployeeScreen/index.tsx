import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Header from '@/components/shared/HeaderComponent';
import { Button, Card } from '@/components/shared/ui';
import { useSession } from '@/hooks/shared/use-session';
import { useCreateEmployee } from '@/hooks/merchant/use-create-employee';
import type { EmployeeForm } from '@/domain/merchant-employee';
import { palette as p, typography as t } from '@/theme/tokens';
const fields: { key: keyof EmployeeForm; label: string; placeholder: string }[] = [
  { key: 'firstName', label: 'الاسم الأول', placeholder: 'أدخل الاسم الأول' },
  { key: 'lastName', label: 'اسم العائلة', placeholder: 'أدخل اسم العائلة' },
  { key: 'email', label: 'البريد الإلكتروني', placeholder: 'employee@example.com' },
  { key: 'password', label: 'كلمة المرور', placeholder: 'أدخل كلمة مرور للموظف' },
  { key: 'confirmPassword', label: 'تأكيد كلمة المرور', placeholder: 'أعد كتابة كلمة المرور' },
];
export default function CreateEmployeeScreen() {
  const { role, restricted } = useSession();
  const state = useCreateEmployee();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const back = () => {
    if (!state.busy) {
      if (router.canGoBack()) router.back();
      else router.replace('/merchant');
    }
  };
  if (role !== 'Merchant' || restricted) return <Redirect href="/" />;
  return (
    <ScreenContainer backgroundColor={p.background}>
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <Header title="إنشاء حساب موظف" onBack={back} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + headerHeight}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[s.page, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          {state.created ? (
            <Card>
              <Icon
                name="check-circle-outline"
                size={62}
                color={p.primary}
                style={{ alignSelf: 'center' }}
              />
              <Text style={s.title}>تم إنشاء حساب الموظف</Text>
              <Text style={s.label}>{state.created.name}</Text>
              <Text selectable style={s.email}>
                {state.created.email}
              </Text>
              <Text style={s.caption}>
                تم إنشاء الحساب بنجاح. يمكنك متابعة العمل بحسابك الحالي.
              </Text>
              <Button title="العودة إلى حسابي" onPress={back} />
              <Button
                title="إضافة موظف آخر"
                secondary
                onPress={() => {
                  state.reset();
                  setVisible(false);
                }}
              />
            </Card>
          ) : (
            <>
              <View style={s.hero}>
                <View style={s.icon}>
                  <Icon name="account-plus-outline" color={p.primary} size={32} />
                </View>
                <Text style={s.title}>وسّع فريق عملك</Text>
                <Text style={s.caption}>أنشئ حسابًا مستقلًا لموظفك للمساعدة في متابعة العمل.</Text>
              </View>
              <Card>
                {fields.map((field) => {
                  const password = field.key === 'password' || field.key === 'confirmPassword';
                  const error = state.errors[field.key];
                  return (
                    <View key={field.key} style={{ gap: 6 }}>
                      <Text style={s.label}>{field.label}</Text>
                      <TextInput
                        accessibilityLabel={field.label}
                        value={state.form[field.key]}
                        placeholder={field.placeholder}
                        placeholderTextColor={p.muted}
                        onChangeText={(value) =>
                          state.setForm((form) => ({ ...form, [field.key]: value }))
                        }
                        editable={!state.busy && !state.uncertain}
                        secureTextEntry={password && !visible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        keyboardType={field.key === 'email' ? 'email-address' : 'default'}
                        style={[
                          s.input,
                          error && { borderColor: p.danger },
                          (password || field.key === 'email') && { writingDirection: 'ltr' },
                        ]}
                      />
                      {!!error && (
                        <Text accessibilityLiveRegion="polite" style={s.error}>
                          {error}
                        </Text>
                      )}
                    </View>
                  );
                })}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={visible ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور'}
                  onPress={() => setVisible(!visible)}
                  style={s.visibility}
                >
                  <Icon
                    name={visible ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={p.primary}
                  />
                  <Text style={{ color: p.primary }}>
                    {visible ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور'}
                  </Text>
                </Pressable>
              </Card>
              {!!state.error && (
                <Card>
                  <Text accessibilityRole="alert" style={s.error}>
                    {state.error}
                  </Text>
                </Card>
              )}
              <Button
                title="إنشاء حساب الموظف"
                icon="account-plus-outline"
                loading={state.busy}
                disabled={state.uncertain}
                onPress={() => void state.submit()}
              />
              <Text style={s.caption}>
                راجع البريد الإلكتروني قبل التأكيد؛ سيستخدمه الموظف لتسجيل الدخول.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  page: { padding: 20, gap: 18, flexGrow: 1 },
  hero: { gap: 10 },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: p.soft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  title: { fontSize: 25, lineHeight: 36, fontFamily: t.bold, color: p.deep },
  label: { fontSize: 15, lineHeight: 24, fontFamily: t.bold },
  caption: { fontSize: 13, lineHeight: 22, color: p.muted },
  email: { fontSize: 16, lineHeight: 26, writingDirection: 'ltr' },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: p.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: t.regular,
    fontSize: 16,
    color: p.ink,
    textAlign: 'right',
    backgroundColor: '#FAFCFA',
  },
  error: { color: p.danger, fontSize: 13, lineHeight: 22 },
  visibility: { flexDirection: 'row-reverse', gap: 8, minHeight: 44, alignItems: 'center' },
});
