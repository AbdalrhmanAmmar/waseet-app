import type { LoginRestriction } from '@/auth/login-restriction';
import { accountReview, type AccountReview } from '@/auth/account-review';
import { RejectedAccountContent } from '@/components/shared/account/RejectedAccountContent';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import ScreenContainer from '@/components/shared/ScreenContainer';
import LinearGradient from '@/components/shared/LinearGradient';
import { ActivationSteps } from '@/components/shared/account/ActivationSteps';
import { SupportSheet } from '@/components/shared/account/SupportSheet';
import { useAccountStatus } from '@/hooks/shared/use-account-status';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { accountStatusContent } from '@/auth/account-status';
import { logout } from '@/store/slices/auth';
import Images from '@/theme/images';
import { palette as p, typography as t } from '@/theme/tokens';
type Props = {
  loginRestriction?: LoginRestriction;
  loginReview?: AccountReview;
  onRetryLogin?: () => void;
};
export default function AccountStatusScreen({
  loginRestriction,
  loginReview,
  onRetryLogin,
}: Props = {}) {
  const { userData, busy, feedback, error, refresh } = useAccountStatus();
  const dispatch = useAppDispatch();
  const [supportOpen, setSupportOpen] = useState(false);
  const content = accountStatusContent(
    loginRestriction ?? userData?.accountStatus ?? userData?.status,
  );
  const name = userData?.firstName?.trim();
  const unauthenticated = !!loginRestriction;
  const primaryLabel = unauthenticated ? 'إعادة تسجيل الدخول' : 'تحديث حالة الحساب';
  const status = loginRestriction ?? userData?.accountStatus ?? userData?.status;
  if (status?.trim().toLowerCase() === 'rejected') {
    return (
      <ScreenContainer edges={['top', 'bottom']} backgroundColor={p.background}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <RejectedAccountContent
            review={unauthenticated ? (loginReview ?? {}) : accountReview(userData)}
            unauthenticated={unauthenticated}
            busy={busy}
            error={error}
            feedback={feedback}
            onSupport={() => setSupportOpen(true)}
            onRefresh={unauthenticated ? () => onRetryLogin?.() : refresh}
            onExit={unauthenticated ? () => onRetryLogin?.() : () => dispatch(logout())}
          />
        </ScrollView>
        <SupportSheet visible={supportOpen} onClose={() => setSupportOpen(false)} />
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer edges={['top', 'bottom']} backgroundColor={p.background}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={s.brand} accessible accessibilityLabel="وسيط">
            <Image source={Images.brandLogo} style={s.logo} />
            <Text style={s.wordmark}>وسيط</Text>
          </View>
          {content.pending ? (
            <Image
              source={require('../../../../assets/images/account-review.png')}
              style={s.illustration}
              resizeMode="contain"
              accessible={false}
            />
          ) : (
            <View style={s.statusIllustration}>
              <Icon name={content.icon} size={84} color={p.primary} />
            </View>
          )}
          <View style={s.badge}>
            <Icon name={content.icon} size={17} color="#D77707" />
            <Text style={s.badgeText}>{content.badge}</Text>
          </View>
          <Text accessibilityRole="header" style={s.title}>
            {content.title}
          </Text>
          <Text style={s.welcome}>
            {name ? `أهلًا ${name}، سعداء بانضمامك` : 'أهلًا بك، سعداء بانضمامك'}
          </Text>
          <Text style={s.description}>{content.description}</Text>
          <ActivationSteps content={content} />
          <View style={s.notice}>
            <Icon name="autorenew" size={21} color="#638B80" />
            <Text style={s.noticeText}>
              {unauthenticated
                ? 'للتحقق من تفعيل حسابك، أعد تسجيل الدخول. يمكنك التواصل مع الدعم في أي وقت.'
                : 'نحدّث الحالة عند عودتك للتطبيق\nوتنتقل تلقائيًا لواجهتك بعد التفعيل'}
            </Text>
          </View>
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
            accessibilityLabel={primaryLabel}
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={unauthenticated ? onRetryLogin : refresh}
            style={({ pressed }) => [s.action, (pressed || busy) && s.pressed]}
          >
            <LinearGradient
              colors={['#148970', '#107D67']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.primary}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Icon name="autorenew" size={24} color="#fff" />
              )}
              <Text style={s.primaryText}>{busy ? 'جارٍ تحديث الحالة...' : primaryLabel}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تواصل مع الدعم"
            onPress={() => setSupportOpen(true)}
            style={({ pressed }) => [s.support, pressed && s.pressed]}
          >
            <Icon name="headset" size={23} color="#107D67" />
            <Text style={s.supportText}>تواصل مع الدعم</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unauthenticated ? 'العودة لتسجيل الدخول' : 'تسجيل الخروج'}
            onPress={unauthenticated ? onRetryLogin : () => dispatch(logout())}
            style={s.logout}
          >
            <Text style={s.logoutText}>
              {unauthenticated ? 'العودة لتسجيل الدخول' : 'تسجيل الخروج'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <SupportSheet visible={supportOpen} onClose={() => setSupportOpen(false)} />
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  content: { width: '100%', maxWidth: 390, alignSelf: 'center' },
  brand: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  logo: { width: 53, height: 53 },
  wordmark: { fontSize: 42, lineHeight: 54, fontFamily: t.bold, color: '#083F34' },
  illustration: {
    width: '76%',
    maxWidth: 280,
    height: 150,
    alignSelf: 'center',
    marginVertical: 2,
  },
  statusIllustration: { height: 150, alignItems: 'center', justifyContent: 'center' },
  badge: {
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    minHeight: 28,
    borderRadius: 20,
    backgroundColor: '#FCE3C4',
    marginTop: 4,
    marginBottom: 6,
  },
  badgeText: { color: '#CE6B03', fontFamily: t.bold, fontSize: 13, lineHeight: 22 },
  title: {
    fontFamily: t.bold,
    color: '#093F34',
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcome: {
    fontFamily: t.bold,
    color: '#23856D',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 5,
  },
  description: {
    color: '#63867B',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 12,
  },
  notice: { alignItems: 'center', gap: 2, paddingVertical: 7 },
  noticeText: { color: '#638B80', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  action: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  primary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  primaryText: {
    fontFamily: t.bold,
    fontSize: 17,
    lineHeight: 26,
    color: '#fff',
    textAlign: 'center',
  },
  support: {
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#147D64',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  supportText: { color: '#107D67', fontSize: 17, lineHeight: 26, fontFamily: t.bold },
  logout: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  logoutText: {
    color: '#688D82',
    textDecorationLine: 'underline',
    fontFamily: t.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  pressed: { opacity: 0.7 },
  error: {
    padding: 12,
    backgroundColor: '#FFF0EB',
    borderRadius: 10,
    color: p.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  feedback: { color: p.primary, fontSize: 12, textAlign: 'center', marginBottom: 5 },
});
