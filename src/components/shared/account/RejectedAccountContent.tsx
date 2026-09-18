import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import Text from '@/components/shared/CustomText';
import LinearGradient from '@/components/shared/LinearGradient';
import type { AccountReview } from '@/auth/account-review';
import Images from '@/theme/images';
import { palette as p, typography as t } from '@/theme/tokens';

interface Props {
  review: AccountReview;
  unauthenticated: boolean;
  busy: boolean;
  error: string;
  feedback: string;
  onSupport: () => void;
  onRefresh: () => void;
  onExit: () => void;
}

export function RejectedAccountContent({
  review,
  unauthenticated,
  busy,
  error,
  feedback,
  onSupport,
  onRefresh,
  onExit,
}: Props) {
  const [copyResult, setCopyResult] = useState('');
  const refreshLabel = unauthenticated ? 'إعادة تسجيل الدخول' : 'تحديث حالة الحساب';
  const exitLabel = unauthenticated ? 'العودة لتسجيل الدخول' : 'تسجيل الخروج';
  const copyId = async () => {
    if (!review.userId) return;
    try {
      const copied = await Clipboard.setStringAsync(review.userId);
      setCopyResult(copied ? 'تم نسخ رقم الحساب' : 'تعذر النسخ. يمكنك تحديد الرقم ونسخه.');
    } catch {
      setCopyResult('تعذر النسخ. يمكنك تحديد الرقم ونسخه.');
    }
  };
  return (
    <View style={s.content} testID="rejected-account-screen">
      <View style={s.brand} accessible accessibilityLabel="وسيط">
        <Image source={Images.brandLogo} style={s.logo} />
        <Text style={s.wordmark}>وسيط</Text>
      </View>
      <Image
        source={require('../../../../assets/images/account-rejected.png')}
        resizeMode="contain"
        style={s.illustration}
        accessible={false}
      />
      <View style={s.badge}>
        <Text style={s.badgeText}>نتيجة مراجعة الحساب</Text>
      </View>
      <Text accessibilityRole="header" style={s.title}>
        لم تتم الموافقة على حسابك
      </Text>
      <Text style={s.greeting}>{review.firstName ? `أهلًا ${review.firstName}` : 'أهلًا بك'}</Text>
      <Text style={s.description}>
        بعد مراجعة طلبك، لم تتم الموافقة على تفعيل الحساب. تواصل مع فريق الدعم لمعرفة التفاصيل
        والخطوات المتاحة.
      </Text>
      {!!review.rejectionReason && (
        <View style={[s.card, s.reason]} testID="rejection-reason">
          <Icon name="file-document-alert-outline" size={34} color="#BC691D" accessible={false} />
          <View style={s.cardBody}>
            <Text style={[s.cardTitle, s.reasonTitle]}>سبب عدم الموافقة</Text>
            <Text selectable style={s.cardText}>
              {review.rejectionReason}
            </Text>
          </View>
        </View>
      )}
      <View style={[s.card, s.next]}>
        <Icon name="headset" size={34} color={p.primary} accessible={false} />
        <View style={s.cardBody}>
          <Text style={s.cardTitle}>الخطوة التالية</Text>
          <Text style={s.cardText}>
            فريق الدعم يقدر يساعدك في معرفة إمكانية تصحيح بياناتك وإعادة مراجعة الطلب.
          </Text>
        </View>
      </View>
      {!!review.userId && (
        <View style={s.account}>
          <Text selectable style={s.accountText}>
            رقم الحساب: {review.userId}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="نسخ رقم الحساب"
            onPress={copyId}
            style={({ pressed }) => [s.copy, pressed && s.pressed]}
          >
            <Icon name="content-copy" size={21} color={p.muted} />
          </Pressable>
        </View>
      )}
      {!!copyResult && (
        <Text accessibilityLiveRegion="polite" style={s.feedback}>
          {copyResult}
        </Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      {!!feedback && !error && (
        <Text accessibilityLiveRegion="polite" style={s.feedback}>
          {feedback}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="تواصل مع الدعم"
        onPress={onSupport}
        style={({ pressed }) => [s.primary, pressed && s.pressed]}
      >
        <LinearGradient
          colors={['#148970', '#08725C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.buttonInner}
        >
          <Icon name="headset" size={25} color="#fff" />
          <Text style={[s.buttonText, s.white]}>تواصل مع الدعم</Text>
        </LinearGradient>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={refreshLabel}
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={onRefresh}
        style={({ pressed }) => [s.secondary, (pressed || busy) && s.pressed]}
      >
        {busy ? (
          <ActivityIndicator color={p.primary} />
        ) : (
          <Icon name={unauthenticated ? 'login' : 'autorenew'} size={25} color={p.primary} />
        )}
        <Text style={s.buttonText}>{busy ? 'جارٍ تحديث الحالة...' : refreshLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={exitLabel}
        onPress={onExit}
        style={({ pressed }) => [s.exit, pressed && s.pressed]}
      >
        <Text style={s.exitText}>{exitLabel}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  content: { width: '100%', maxWidth: 390, alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: 4 },
  logo: { width: 58, height: 58 },
  wordmark: { fontFamily: t.bold, fontSize: 29, lineHeight: 34, color: p.deep },
  illustration: { width: '82%', maxWidth: 275, height: 162, alignSelf: 'center', marginBottom: 4 },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#F6EBDD',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#885321',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: t.bold,
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 37,
    color: '#073C35',
    fontFamily: t.bold,
    textAlign: 'center',
    marginTop: 12,
  },
  greeting: {
    fontSize: 20,
    lineHeight: 30,
    color: p.primary,
    fontFamily: t.bold,
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    color: '#626B70',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 13,
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    marginBottom: 10,
  },
  cardBody: { flex: 1, minWidth: 0, gap: 5 },
  reason: { borderColor: '#EFC498', backgroundColor: '#FFFEFC' },
  next: { borderColor: '#D2E9DF', backgroundColor: '#EEF7F2' },
  cardTitle: {
    fontSize: 17,
    lineHeight: 25,
    fontFamily: t.bold,
    color: p.primary,
    textAlign: 'right',
  },
  reasonTitle: { color: '#AF601B' },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#626B70',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  account: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#EFF2ED',
    borderRadius: 12,
    paddingRight: 16,
    marginBottom: 10,
  },
  accountText: {
    flex: 1,
    color: '#626B70',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    paddingVertical: 10,
  },
  copy: { minWidth: 48, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  primary: { borderRadius: 12, overflow: 'hidden' },
  buttonInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 49,
    padding: 10,
  },
  buttonText: {
    fontFamily: t.bold,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    color: p.primary,
    flexShrink: 1,
  },
  white: { color: '#fff' },
  secondary: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    minHeight: 49,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: p.primary,
    marginTop: 10,
  },
  exit: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  exitText: {
    color: '#626B70',
    fontFamily: t.medium,
    fontSize: 14,
    textDecorationLine: 'underline',
    lineHeight: 22,
  },
  feedback: { color: p.primary, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  error: {
    padding: 12,
    backgroundColor: '#FFF0EB',
    borderRadius: 10,
    color: p.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  pressed: { opacity: 0.7 },
});
