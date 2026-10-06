import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../CustomText';
import { OrderStatusSummary } from '../orders/OrderStatusSummary';
import type { DeliveryMode } from '@/domain/order-workflow';
import { palette as p, typography as t } from '@/theme/tokens';
import type { Order } from '@/types/models';
export default function OrderCard({
  order,
  onPress,
  mode = 'unknown',
}: {
  order: Order;
  onPress: () => void;
  mode?: DeliveryMode;
}) {
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
      <OrderStatusSummary order={order} mode={mode} />
      <View style={s.bottom}>
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
  amount: { fontSize: 20, lineHeight: 30, fontFamily: t.bold, writingDirection: 'ltr' },
  currency: { fontSize: 11, color: p.muted },
  date: { fontSize: 12, color: p.muted },
});
