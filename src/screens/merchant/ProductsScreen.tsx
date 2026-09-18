import { useMerchantCatalog } from '@/hooks/merchant';
import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/ProductsScreen';
export default function MerchantProductsScreen() {
  const catalog = useMerchantCatalog();
  return <Screen {...useScreenProps()} catalog={catalog} />;
}
