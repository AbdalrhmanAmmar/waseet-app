import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/FavoriteProducts';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
