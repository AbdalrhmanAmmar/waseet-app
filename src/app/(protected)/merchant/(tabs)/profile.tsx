import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/ProfileScreen';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
