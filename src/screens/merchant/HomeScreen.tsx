import { useMerchantCatalog } from '@/hooks/merchant';
import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/HomeScreen';
export default function MerchantHomeScreen() {
  const catalog = useMerchantCatalog();
  return <Screen {...useScreenProps()} catalog={catalog} />;
}
