import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/auth/OnboardingScreen';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
