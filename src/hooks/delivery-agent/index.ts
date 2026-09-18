import { useDeliveriesInfiniteQuery } from '@/api/delivery-agent';
import { useOrderList } from '../shared/use-order-list';
export function useDeliveryOrders() {
  return useOrderList(useDeliveriesInfiniteQuery);
}
