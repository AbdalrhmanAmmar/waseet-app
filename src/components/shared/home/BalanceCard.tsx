import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { useBalance } from '@/hooks/shared/use-balance';
import { balanceNumber, formatBalance } from '@/domain/balance';
import { s } from './styles';
export function BalanceCard() {
  const { user, busy, failed, refresh } = useBalance();
  const [hidden, setHidden] = useState(false);
  const value = balanceNumber(user?.dollarBalance);
  const stale = failed || user?.balanceStale;
  const time = user?.balanceUpdatedAt
    ? new Date(user.balanceUpdatedAt).toLocaleString('ar-EG', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  return (
    <LinearGradient
      colors={['#103E32', '#19614D']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={s.balance}
      testID="balance-card"
    >
      <View style={s.row}>
        <Text style={s.balanceLabel}>
          {stale && value !== null ? 'آخر رصيد معروف' : 'رصيد حسابك'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'إظهار الرصيد' : 'إخفاء الرصيد'}
            onPress={() => setHidden(!hidden)}
            style={s.icon}
          >
            <Icon name={hidden ? 'eye-off-outline' : 'eye-outline'} size={22} color="#fff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تحديث الرصيد"
            accessibilityState={{ busy, disabled: busy }}
            disabled={busy}
            onPress={() => void refresh()}
            style={s.icon}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Icon name="refresh" size={23} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
      <Text
        style={[s.amount, value === null && !hidden && { fontSize: 23 }]}
        testID="balance-amount"
      >
        {hidden ? (
          '••••••'
        ) : value !== null ? (
          <>
            {formatBalance(value)} <Text style={{ fontSize: 16, color: '#C6E7DB' }}>USD</Text>
          </>
        ) : busy ? (
          'جارٍ تحميل الرصيد…'
        ) : (
          'الرصيد غير متاح حاليًا'
        )}
      </Text>
      <View style={[s.row, { justifyContent: 'flex-start' }]}>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: stale ? '#F2B66E' : '#67D4A2',
          }}
        />
        <Text style={[s.balanceMeta, { flex: 1 }]}>
          {busy
            ? 'جارٍ تحديث بيانات الحساب…'
            : failed
              ? 'تعذر تحديث الرصيد. اضغط التحديث للمحاولة.'
              : user?.balanceStale
                ? 'لم يُرجع التحديث رصيدًا مؤكدًا'
                : time
                  ? `آخر تحديث: ${time}`
                  : 'حدّث بيانات حسابك لعرض الرصيد'}
        </Text>
      </View>
      {stale && time && <Text style={s.balanceMeta}>آخر قيمة مؤكدة: {time}</Text>}
    </LinearGradient>
  );
}
