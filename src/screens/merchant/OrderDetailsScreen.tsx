import { OrderProfit } from '@/components/merchant/OrderProfit';
import { useScreenProps } from '@/navigation/use-screen-props';
import Details from '@/screens/shared/OrderDetails';
export default function MerchantOrderDetailsScreen() {
  return <Details {...useScreenProps()} profit={OrderProfit} />;
}
