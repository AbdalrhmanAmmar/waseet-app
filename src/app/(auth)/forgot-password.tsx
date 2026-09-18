import { useScreenProps } from '@/navigation/use-screen-props';
import Screen from '@/screens/auth/ForgetPassword';
export default function Route() {
  return <Screen {...useScreenProps()} />;
}
