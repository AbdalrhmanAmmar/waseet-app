import { useMerchantOrders } from '@/hooks/merchant';
import { useScreenProps } from '@/navigation/use-screen-props';
import Orders from '@/screens/shared/MyOrders';
export default function MerchantOrdersScreen() {
  const controller = useMerchantOrders();
  return <Orders {...useScreenProps()} title="طلبات التاجر" controller={controller} />;
}
