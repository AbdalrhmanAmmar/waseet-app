import { useSalesOrdersQuery } from '@/api/sales-employee';
import { useCatalog } from '../shared/use-catalog';
import { useOrderList } from '../shared/use-order-list';
export function useSalesCatalog() {
  return useCatalog();
}
export function useSalesOrders() {
  return useOrderList(useSalesOrdersQuery);
}
