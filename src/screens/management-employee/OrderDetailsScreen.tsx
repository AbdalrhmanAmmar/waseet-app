import { ManagementOrderActions } from '@/components/management-employee/OrderActions';
import { useScreenProps } from '@/navigation/use-screen-props';
import Details from '@/screens/shared/OrderDetails';
export default function ManagementOrderDetailsScreen() {
  return <Details {...useScreenProps()} actions={ManagementOrderActions} />;
}
