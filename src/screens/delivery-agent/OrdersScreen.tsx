import { useDeliveryOrders } from '@/hooks/delivery-agent';
import { OrdersWorkspace } from '@/components/shared/orders/OrdersWorkspace';
import { DeliveryStatusSheet } from '@/components/delivery-agent/orders/DeliveryStatusSheet';
export default function DeliveryOrdersScreen() {
  const controller = useDeliveryOrders();
  return (
    <OrdersWorkspace controller={controller} variant="delivery" StatusSheet={DeliveryStatusSheet} />
  );
}
