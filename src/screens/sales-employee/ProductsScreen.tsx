import { useSalesCatalog } from '@/hooks/sales-employee';
import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/ProductsScreen';
export default function SalesProductsScreen() {
  const catalog = useSalesCatalog();
  return <Screen {...useScreenProps()} catalog={catalog} />;
}
