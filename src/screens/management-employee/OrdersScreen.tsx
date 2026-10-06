import { useManagementOrders } from '@/hooks/management-employee';
import { OrdersWorkspace } from '@/components/shared/orders/OrdersWorkspace';
import { ManagementStatusSheet } from '@/components/management-employee/orders/ManagementStatusSheet';
export default function ManagementOrdersScreen() {
  const controller = useManagementOrders();
  return (
    <OrdersWorkspace
      controller={controller}
      variant="management"
      StatusSheet={ManagementStatusSheet}
    />
  );
}
