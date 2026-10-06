import { isMerchantRole } from '@/auth/roles';
import { useState } from 'react';
import { View } from 'react-native';
import { useChangeOrderStatusMutation } from '@/api/shared/orders';
import { OrderStatusSheet } from './OrderStatusSheet';
import { Button, ui } from '../ui';
import Text from '../CustomText';
import { useSession } from '@/hooks/shared/use-session';
import { normalizeStatus } from '@/domain/order-workflow';
import type { Order } from '@/types/models';
export function OrderActions({ order, disabled = false }: { order: Order; disabled?: boolean }) {
  const [open, setOpen] = useState(false),
    [saved, setSaved] = useState(false);
  const [save, result] = useChangeOrderStatusMutation();
  const { role } = useSession();
  const variant = isMerchantRole(role)
    ? 'merchant'
    : role === 'SalesEmployee'
      ? 'sales'
      : role === 'DeliveryAgent'
        ? 'delivery'
        : 'management';
  return (
    <View style={{ gap: 12 }}>
      {saved && <Text style={ui.caption}>تم تحديث حالة الطلب.</Text>}
      <Button
        disabled={disabled}
        title={normalizeStatus(order.status) === 'stuck' ? 'حل الطلب المتعثر' : 'تحديث حالة الطلب'}
        onPress={() => {
          setSaved(false);
          setOpen(true);
        }}
      />
      {open && (
        <OrderStatusSheet
          orderId={order.orderId}
          variant={variant}
          saving={result.isLoading}
          save={(args) => save(args).unwrap()}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            setSaved(true);
          }}
        />
      )}
    </View>
  );
}
