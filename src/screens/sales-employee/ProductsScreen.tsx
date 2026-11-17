import { useSalesCatalog } from '@/hooks/sales-employee';
import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/ProductsScreen';
export default function SalesProductsScreen() {
  // Same Product/all catalog as merchants (images, categories, videos in details),
  // filtered by the API layer to expectedSellPrice for this role.
  const catalog = useSalesCatalog();
  return <Screen {...useScreenProps()} catalog={catalog} />;
}
