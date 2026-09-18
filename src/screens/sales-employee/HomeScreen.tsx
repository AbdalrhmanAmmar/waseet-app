import { useSalesCatalog } from '@/hooks/sales-employee';
import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/HomeScreen';
export default function SalesHomeScreen() {
  const catalog = useSalesCatalog();
  return <Screen {...useScreenProps()} catalog={catalog} />;
}
