import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Linking,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '@/components/shared/CustomText';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Header from '@/components/shared/HeaderComponent';
import { Button, Card } from '@/components/shared/ui';
import { useBalance } from '@/hooks/shared/use-balance';
import { useSession } from '@/hooks/shared/use-session';
import { useMerchantWithdrawalRequestMutation } from '@/api/merchant/withdrawals';
import { amountCents, balanceCents, withdrawalFormErrors } from '@/domain/withdrawal';
import { formatBalance } from '@/domain/balance';
import { palette as p, typography as t } from '@/theme/tokens';
import type { ApiError } from '@/types/models';

export default function WithdrawalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const { user, busy, failed, refresh } = useBalance();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [review, setReview] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [touched, setTouched] = useState(false);
  const [noteTouched, setNoteTouched] = useState(false);
  const lock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const [send, result] = useMerchantWithdrawalRequestMutation({
    fixedCacheKey: `withdrawal-${user?.userId}`,
  });
  const cents = balanceCents(user?.dollarBalance);
  const verified = !busy && !failed && !user?.balanceStale && cents !== null;
  const validation = withdrawalFormErrors(amount, verified ? user?.dollarBalance : null, note);
  const error = result.error as ApiError | undefined;
  const uncertain = error?.status === 'WITHDRAWAL_UNCERTAIN';
  const blocked = result.isLoading || uncertain || result.isSuccess;
  const back = () => {
    if (!result.isLoading) {
      if (router.canGoBack()) router.back();
      else router.replace('/merchant');
    }
  };
  async function confirm() {
    if (lock.current || blocked || validation.amount || validation.note) return;
    lock.current = true;
    try {
      await send({ amount: amountCents(amount)! / 100, note: note.trim() }).unwrap();
      setReview(false);
      void refresh();
    } catch {
      setReview(false);
      void refresh();
    } finally {
      lock.current = false;
    }
  }
  if (session.role !== 'Merchant' || session.restricted) return <Redirect href="/" />;
  return (
    <ScreenContainer backgroundColor="#F7F8F3">
      <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
        <Header title="طلب سحب" onBack={back} />
      </View>
      {result.isSuccess ? (
        <ScrollView
          contentContainerStyle={[s.success, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <View style={s.successIcon}>
            <Icon name="check-decagram-outline" size={68} color={p.primary} />
          </View>
          <Text style={s.title}>تم إرسال طلب السحب</Text>
          <Text style={s.description}>
            طلبك وصل بنجاح. إرسال الطلب لا يعني اكتمال التحويل، وسيظهر الرصيد وفق تحديثات حسابك.
          </Text>
          <Button
            title="العودة إلى حسابك"
            onPress={() => {
              result.reset();
              back();
            }}
            style={{ alignSelf: 'stretch' }}
          />
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1, minHeight: 0 }}
          keyboardVerticalOffset={insets.top + headerHeight}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scroll}
            style={{ flex: 1, minHeight: 0 }}
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => {
              if (error) scroll.current?.scrollToEnd({ animated: true });
            }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[s.page, { paddingBottom: Math.max(insets.bottom, 20) }]}
          >
            <Text style={s.title}>اطلب سحب رصيدك</Text>
            <Text style={s.description}>حدد المبلغ، راجع التفاصيل، ثم أرسل طلبك.</Text>
            <LinearGradient
              colors={['#103E32', '#19614D']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.balance}
            >
              <View style={s.row}>
                <Text style={{ color: '#D3EADF' }}>رصيد حسابك</Text>
                <Icon name="wallet-outline" color="#D3EADF" size={25} />
              </View>
              <Text style={s.balanceAmount}>
                {cents === null ? 'غير متاح' : formatBalance(cents / 100)}{' '}
                <Text style={{ fontSize: 16, lineHeight: 44, color: '#D3EADF' }}>USD</Text>
              </Text>
              <Text style={{ color: '#D3EADF', fontSize: 13 }}>
                {busy
                  ? 'جارٍ تحديث الرصيد…'
                  : verified
                    ? 'سنتحقق من الرصيد مرة أخرى قبل الإرسال'
                    : 'تعذر تأكيد الرصيد الحالي'}
              </Text>
              {!verified && (
                <Button
                  title="تحديث الرصيد"
                  secondary
                  loading={busy}
                  onPress={() => void refresh()}
                />
              )}
            </LinearGradient>
            <Card style={s.card}>
              <Text style={s.label}>كم تريد أن تسحب؟</Text>
              <View
                style={[
                  s.amountBox,
                  touched && validation.amount ? { borderColor: p.danger } : null,
                ]}
              >
                <Text style={s.currency}>USD</Text>
                <TextInput
                  testID="withdrawal-amount"
                  accessibilityLabel="مبلغ السحب"
                  value={amount}
                  onChangeText={(v) => {
                    setAmount(v);
                    setTouched(true);
                  }}
                  onBlur={() => setTouched(true)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#A2B1A8"
                  editable={!blocked}
                  maxLength={16}
                  style={s.input}
                />
              </View>
              {touched && validation.amount && (
                <Text accessibilityLiveRegion="polite" style={s.error}>
                  {validation.amount}
                </Text>
              )}
              <View style={s.shortcuts}>
                {[25, 50, 75, 100].map((percent) => (
                  <Pressable
                    key={percent}
                    accessibilityRole="button"
                    accessibilityLabel={percent === 100 ? 'سحب كامل الرصيد' : `سحب ${percent}%`}
                    disabled={!verified || blocked || cents === 0}
                    onPress={() => {
                      setAmount((Math.floor((cents! * percent) / 100) / 100).toFixed(2));
                      setTouched(true);
                    }}
                    style={[s.chip, (!verified || blocked || cents === 0) && { opacity: 0.4 }]}
                  >
                    <Text style={s.chipText}>{percent === 100 ? 'الكل' : `${percent}%`}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.caption}>المبلغ أكبر من صفر ولا يتجاوز رصيد حسابك.</Text>
            </Card>
            <Card style={s.card}>
              <View style={s.row}>
                <Text style={s.label}>ملاحظة</Text>
                <Text style={s.caption}>مطلوب</Text>
              </View>
              <TextInput
                accessibilityLabel="ملاحظة طلب السحب"
                value={note}
                onChangeText={(value) => {
                  setNote(value);
                  setNoteTouched(true);
                }}
                onBlur={() => setNoteTouched(true)}
                editable={!blocked}
                placeholder="أضف ملاحظة تخص طلبك…"
                placeholderTextColor={p.muted}
                multiline
                style={[s.note, noteTouched && validation.note ? { borderColor: p.danger } : null]}
              />
              {noteTouched && validation.note && (
                <Text accessibilityLiveRegion="polite" style={s.error}>
                  {validation.note}
                </Text>
              )}
            </Card>
            <View style={s.info}>
              <Icon name="information-outline" size={21} color={p.primary} />
              <Text style={[s.description, { flex: 1 }]}>
                تأكد من المبلغ والملاحظة قبل إرسال طلبك. تأكيد الإرسال لا يعني اكتمال التحويل.
              </Text>
            </View>
            {error && (
              <Card style={{ borderColor: p.danger }}>
                <Text accessibilityLiveRegion="polite" style={s.error}>
                  {error.message}
                </Text>
                {uncertain && (
                  <Button
                    title="التواصل مع الدعم"
                    secondary
                    onPress={() => {
                      void Linking.openURL(
                        'mailto:abdammar2023@gmail.com?subject=Withdrawal%20request',
                      ).catch(() => {});
                    }}
                  />
                )}
              </Card>
            )}
            <View style={s.footer}>
              <Button
                title="مراجعة طلب السحب"
                icon="arrow-left"
                disabled={!!validation.amount || !!validation.note || !verified || !!blocked}
                loading={result.isLoading}
                onPress={() => {
                  Keyboard.dismiss();
                  setReview(true);
                }}
              />
            </View>
          </ScrollView>
          <Modal
            visible={review}
            transparent
            animationType="slide"
            onRequestClose={() => {
              if (!result.isLoading) setReview(false);
            }}
          >
            <View style={s.overlay}>
              <View
                accessibilityViewIsModal
                style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
              >
                <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 16 }}>
                  <View style={s.handle} />
                  <Text style={s.title}>راجع طلب السحب</Text>
                  <Text style={s.description}>سيتم إرسال الطلب بالمبلغ التالي</Text>
                  <Text style={s.reviewAmount}>
                    {formatBalance((amountCents(amount) ?? 0) / 100)} USD
                  </Text>
                  {!!note.trim() && (
                    <Card style={s.card}>
                      <Text style={s.caption}>ملاحظتك</Text>
                      <Text>{note.trim()}</Text>
                    </Card>
                  )}
                  <Text style={s.description}>
                    هذا تأكيد لإرسال طلب السحب، وليس تأكيدًا لوصول الأموال.
                  </Text>
                  <Button
                    title="تأكيد وإرسال الطلب"
                    loading={result.isLoading}
                    disabled={!!validation.amount || !!validation.note || !!uncertain}
                    onPress={() => void confirm()}
                  />
                  <Button
                    title="تعديل الطلب"
                    secondary
                    disabled={result.isLoading}
                    onPress={() => setReview(false)}
                  />
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  page: { padding: 16, gap: 12, flexGrow: 1 },
  card: { padding: 16, gap: 10 },
  title: { fontFamily: t.bold, fontSize: 23, lineHeight: 32, color: p.deep },
  description: { color: p.muted, fontSize: 14, lineHeight: 24 },
  balance: { borderRadius: 20, padding: 18, gap: 8 },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 44,
    includeFontPadding: true,
    fontFamily: t.bold,
    writingDirection: 'ltr',
  },
  label: { color: p.ink, fontFamily: t.bold, fontSize: 17 },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: p.border,
    backgroundColor: '#FAFCFA',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  currency: { fontFamily: t.bold, color: p.muted },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 28,
    fontFamily: t.bold,
    color: p.deep,
    paddingVertical: 12,
    textAlign: 'right',
  },
  shortcuts: { flexDirection: 'row-reverse', gap: 8 },
  chip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: p.soft,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: { color: p.primary, fontFamily: t.bold },
  caption: { color: p.muted, fontSize: 12, lineHeight: 20 },
  note: {
    minHeight: 76,
    textAlignVertical: 'top',
    textAlign: 'right',
    fontFamily: t.regular,
    fontSize: 15,
    color: p.ink,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAFCFA',
  },
  error: { color: p.danger, fontSize: 14, lineHeight: 23 },
  info: { flexDirection: 'row-reverse', gap: 10, paddingHorizontal: 4 },
  footer: { paddingTop: 4 },
  overlay: { flex: 1, backgroundColor: '#06261BB3', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: p.border },
  reviewAmount: {
    color: p.primary,
    fontSize: 36,
    lineHeight: 52,
    includeFontPadding: true,
    fontFamily: t.bold,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  success: { flexGrow: 1, justifyContent: 'center', padding: 28, gap: 24, alignItems: 'center' },
  successIcon: { padding: 28, borderRadius: 80, backgroundColor: p.soft },
});
