import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { deliveryMode } from '@/domain/order-workflow';
export function useOrderDeliveryMode(area?: string) {
  const query = useDeliveryAreasQuery(undefined, { refetchOnMountOrArgChange: true });
  return {
    ...query,
    mode: query.isError ? ('unknown' as const) : deliveryMode(area, query.currentData ?? []),
  };
}
