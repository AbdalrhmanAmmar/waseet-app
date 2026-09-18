import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/MenuScreen';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
