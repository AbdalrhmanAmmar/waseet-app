import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/shared/TrackOrder';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
