import { Pressable, View } from 'react-native';
import Text from '../CustomText';
import { s } from './styles';
import { statusLabel } from '../orders/statuses';
import { formatBalance } from '@/domain/balance';
import type { Order } from '@/types/models';
export function RecentOrder({ order, onPress }: { order: Order; onPress: () => void }) {
  const color =
    order.status === 'Delivered'
      ? ['#E2F6EC', '#147D64']
      : order.status === 'Out for Delivery'
        ? ['#E7F4FC', '#217CAE']
        : ['#FFF1DF', '#92611E'];
  const date = new Date(order.createdAt ?? '');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`فتح طلب #${order.orderId}`}
      onPress={onPress}
      style={s.orderRow}
    >
      <View style={s.row}>
        <Text style={s.orderName} numberOfLines={1}>
          {order.customerName || 'عميل'} <Text style={s.caption}> #{order.orderId}</Text>
        </Text>
        <Text style={s.money}>
          {Number.isFinite(order.orderTotalUSD) ? formatBalance(order.orderTotalUSD) : '—'} USD
        </Text>
      </View>
      <View style={s.row}>
        <Text style={s.caption}>
          {Number.isFinite(date.getTime())
            ? date.toLocaleString('ar-EG', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'التاريخ غير متوفر'}
        </Text>
        <View style={[s.status, { backgroundColor: color[0] }]}>
          <Text style={{ color: color[1], fontSize: 11 }}>
            {statusLabel(order.status) || 'الحالة غير متوفرة'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
