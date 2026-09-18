import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/CartScreen';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
