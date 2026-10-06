import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { resolveDeliveryMode } from '@/domain/order-delivery-list';
import type { Order } from '@/types/models';
export function useOrderDeliveryMode(order: Order) {
  const query = useDeliveryAreasQuery(undefined, { refetchOnMountOrArgChange: true });
  return {
    ...query,
    mode: resolveDeliveryMode(order, query.isError ? [] : (query.currentData ?? [])),
  };
}
