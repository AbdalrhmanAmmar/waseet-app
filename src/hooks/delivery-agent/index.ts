import { useDeliveriesInfiniteQuery } from '@/api/delivery-agent';
import { useSession } from '../shared/use-session';
import { useOrderWorkspace } from '../shared/use-order-workspace';
export function useDeliveryOrders() {
  const { userData } = useSession();
  const query = useDeliveriesInfiniteQuery(String(userData?.userId ?? ''), { skip: !userData });
  return useOrderWorkspace(query);
}
