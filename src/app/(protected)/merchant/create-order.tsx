import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/CreateOrder';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
