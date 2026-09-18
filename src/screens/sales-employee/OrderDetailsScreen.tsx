import { useScreenProps } from '@/navigation/use-screen-props';
import Details from '@/screens/shared/OrderDetails';
export default function SalesOrderDetailsScreen() {
  return <Details {...useScreenProps()} />;
}
