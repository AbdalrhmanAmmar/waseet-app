import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../CustomText';
import { statusLabel } from '../orders/statuses';
import { palette as p, typography as t } from '@/theme/tokens';
import type { Order } from '@/types/models';
export default function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const done = ['Delivered', 'Completed'].includes(order.status);
  const failed = ['Cancelled', 'Rejected', 'Stuck', 'Returned'].includes(order.status);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`فتح طلب #${order.orderId}`}
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}
    >
      <View style={s.row}>
        <View style={s.icon}>
          <Icon name="package-variant-closed" color={p.primary} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>طلب #{order.orderId}</Text>
          <Text style={s.customer}>{order.customerName || 'تفاصيل العميل'}</Text>
        </View>
        <Icon name="chevron-left" size={20} color={p.muted} />
      </View>
      <View style={s.bottom}>
        <View style={[s.status, { backgroundColor: done ? p.soft : failed ? '#FCECEC' : p.warm }]}>
          <View
            style={[s.dot, { backgroundColor: done ? p.primary : failed ? p.danger : '#A56720' }]}
          />
          <Text style={[s.statusText, { color: done ? p.primary : failed ? p.danger : '#86551D' }]}>
            {statusLabel(order.status)}
          </Text>
        </View>
        <Text style={s.amount}>
          {order.orderTotalUSD.toLocaleString('en-US')} <Text style={s.currency}>USD</Text>
        </Text>
      </View>
      {!!order.createdAt && (
        <Text style={s.date}>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</Text>
      )}
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    marginBottom: 12,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.soft,
  },
  title: { fontFamily: t.bold, fontSize: 17 },
  customer: { fontSize: 13, color: p.muted },
  bottom: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: t.medium },
  amount: { fontSize: 20, fontFamily: t.bold, writingDirection: 'ltr' },
  currency: { fontSize: 11, color: p.muted },
  date: { fontSize: 12, color: p.muted },
});
