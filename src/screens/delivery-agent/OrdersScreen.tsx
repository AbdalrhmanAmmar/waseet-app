import { useDeliveryOrders } from '@/hooks/delivery-agent';
import { useScreenProps } from '@/navigation/use-screen-props';
import Orders from '@/screens/shared/MyOrders';
export default function DeliveryOrdersScreen() {
  const controller = useDeliveryOrders();
  return <Orders {...useScreenProps()} title="توصيلاتي" controller={controller} />;
}
