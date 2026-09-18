import { useManagementOrdersQuery } from '@/api/management-employee';
import { useOrderList } from '../shared/use-order-list';
export function useManagementOrders() {
  return useOrderList(useManagementOrdersQuery);
}
