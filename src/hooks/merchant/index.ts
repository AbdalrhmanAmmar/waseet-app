import { useMerchantOrdersQuery } from '@/api/merchant';
import { useCatalog } from '../shared/use-catalog';
import { useOrderList } from '../shared/use-order-list';
export function useMerchantCatalog() {
  // Product/all supplies the catalog and its prices for the authenticated merchant.
  return useCatalog();
}
export function useMerchantOrders() {
  return useOrderList(useMerchantOrdersQuery);
}
