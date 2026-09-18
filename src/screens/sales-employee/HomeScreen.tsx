import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/HomeScreen';
export default function SalesHomeScreen() {
  return <Screen {...useScreenProps()} />;
}
