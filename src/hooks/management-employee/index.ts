import { useManagementOrdersQuery } from '@/api/management-employee';
import { useSession } from '../shared/use-session';
import { useOrderWorkspace } from '../shared/use-order-workspace';
export function useManagementOrders() {
  const { userData } = useSession();
  const query = useManagementOrdersQuery(String(userData?.userId ?? ''), { skip: !userData });
  return useOrderWorkspace(query);
}
