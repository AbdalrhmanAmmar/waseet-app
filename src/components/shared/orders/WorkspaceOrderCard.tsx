import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { OrderStatusSummary } from './OrderStatusSummary';
import type { DeliveryMode } from '@/domain/order-workflow';
import { orderMap, orderPhone } from '@/domain/order-workspace';
import type { Order } from '@/types/models';
import { colors as p, styles as s } from './workspace-styles';
export function WorkspaceOrderCard({
  order,
  mode = 'unknown',
  terminal,
  variant = 'delivery',
  onOpen,
  onUpdate,
}: {
  order: Order;
  mode?: DeliveryMode;
  terminal: boolean;
  variant?: 'delivery' | 'management';
  onOpen: () => void;
  onUpdate: () => void;
}) {
  const [error, setError] = useState('');
  const phone = orderPhone(order.customerMobile);
  const map = orderMap(order);
  const open = async (url: string | null, kind: string) => {
    if (!url) return;
    setError('');
    try {
      await Linking.openURL(url);
    } catch {
      setError(`تعذر فتح ${kind}. حاول مرة أخرى.`);
    }
  };
  return (
    <View style={s.card} testID={`${variant}-order-${order.orderId}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`فتح طلب #${order.orderId}`}
        onPress={onOpen}
        style={({ pressed }) => [s.details, pressed && s.pressed]}
      >
        <View style={s.cardHeader}>
          <Text style={s.orderId}>طلب {`\u200E#${order.orderId}`}</Text>
        </View>
        <OrderStatusSummary order={order} mode={mode} />
        <Text style={s.name}>{order.customerName || 'اسم العميل غير متوفر'}</Text>
        <View style={s.location}>
          <Icon name="map-marker-outline" size={20} color={p.muted} />
          <Text style={s.address}>{order.customerArea || 'المنطقة غير متوفرة'}</Text>
        </View>
        <Text style={s.address}>{order.customerAddress || 'العنوان غير متوفر'}</Text>
        {variant === 'management' &&
          order.createdAt &&
          Number.isFinite(new Date(order.createdAt).getTime()) && (
            <Text style={s.hint}>
              تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-EG')}
            </Text>
          )}
      </Pressable>
      <View style={s.divider}>
        <View style={s.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`اتصال بعميل الطلب ${order.orderId}`}
            disabled={!phone}
            onPress={() => void open(phone, 'الاتصال')}
            style={({ pressed }) => [s.secondary, !phone && s.disabled, pressed && s.pressed]}
          >
            <Icon name="phone-outline" size={20} color={p.deep} />
            <Text style={s.buttonText}>{phone ? 'اتصال' : 'الهاتف غير متوفر'}</Text>
          </Pressable>
          {variant === 'delivery' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`البحث بعنوان الطلب ${order.orderId} في الخريطة`}
              disabled={!map}
              onPress={() => void open(map, 'الخريطة')}
              style={({ pressed }) => [s.secondary, !map && s.disabled, pressed && s.pressed]}
            >
              <Icon name="map-marker-outline" size={20} color={p.deep} />
              <Text style={s.buttonText}>{map ? 'الخريطة' : 'العنوان غير متوفر'}</Text>
            </Pressable>
          )}
        </View>
        {variant === 'delivery' && !!map && (
          <Text style={[s.hint, s.center]}>الخريطة تبحث بالعنوان المكتوب.</Text>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        {terminal ? (
          <Text style={[s.hint, s.center]}>هذا الطلب في حالة نهائية</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`تحديث حالة الطلب ${order.orderId}`}
            onPress={onUpdate}
            style={({ pressed }) => [s.primary, pressed && s.pressed]}
          >
            <Text style={[s.buttonText, s.white]}>تحديث حالة الطلب</Text>
            <Icon name="chevron-left" size={22} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
