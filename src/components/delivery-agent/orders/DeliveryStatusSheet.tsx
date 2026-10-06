import { useDeliveryOrderStatusMutation } from '@/api/delivery-agent';
import {
  OrderStatusSheet,
  type OrderStatusSheetProps,
} from '@/components/shared/orders/OrderStatusSheet';
export function DeliveryStatusSheet(props: OrderStatusSheetProps) {
  const [save, result] = useDeliveryOrderStatusMutation();
  return (
    <OrderStatusSheet
      {...props}
      variant="delivery"
      saving={result.isLoading}
      save={(value) => save(value).unwrap()}
    />
  );
}
