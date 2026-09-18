import { DeliveryOrderActions } from '@/components/delivery-agent/OrderActions';
import { useScreenProps } from '@/navigation/use-screen-props';
import Details from '@/screens/shared/OrderDetails';
export default function DeliveryOrderDetailsScreen() {
  return <Details {...useScreenProps()} actions={DeliveryOrderActions} />;
}
