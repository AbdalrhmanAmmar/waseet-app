import { useManagementOrderStatusMutation } from '@/api/management-employee';
import {
  OrderStatusSheet,
  type OrderStatusSheetProps,
} from '@/components/shared/orders/OrderStatusSheet';
export function ManagementStatusSheet(props: OrderStatusSheetProps) {
  const [save, result] = useManagementOrderStatusMutation();
  return (
    <OrderStatusSheet
      {...props}
      variant="management"
      saving={result.isLoading}
      save={(value) => save(value).unwrap()}
    />
  );
}
