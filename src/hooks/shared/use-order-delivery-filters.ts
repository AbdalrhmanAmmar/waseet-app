import { useState } from 'react';
import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { filterByDelivery, type DeliveryFilter } from '@/domain/order-delivery-list';
import type { Order } from '@/types/models';
export function useOrderDeliveryFilters(orders: Order[]) {
  const areasQuery = useDeliveryAreasQuery();
  const areas = areasQuery.currentData ?? [];
  const [mode, setMode] = useState<DeliveryFilter>('all');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [localStatuses, setLocalStatuses] = useState<string[]>([]);
  return {
    mode,
    statuses,
    localStatuses,
    areas,
    areasQuery,
    orders: filterByDelivery(orders, areas, mode, statuses, localStatuses),
    setStatuses,
    setLocalStatuses,
    setMode: (value: DeliveryFilter) => {
      setMode(value);
      setStatuses([]);
      setLocalStatuses([]);
    },
    clear: () => {
      setMode('all');
      setStatuses([]);
      setLocalStatuses([]);
    },
  };
}
