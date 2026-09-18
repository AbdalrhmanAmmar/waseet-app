import { useManagementOrders } from '@/hooks/management-employee';
import { useScreenProps } from '@/navigation/use-screen-props';
import Orders from '@/screens/shared/MyOrders';
export default function ManagementOrdersScreen() {
  const controller = useManagementOrders();
  return <Orders {...useScreenProps()} title="طلبات الإدارة" controller={controller} />;
}
