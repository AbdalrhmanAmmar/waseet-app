import { useManagementOrderStatusMutation } from '@/api/management-employee';
import { StatusEditor } from '@/components/shared/orders/StatusEditor';
import type { Order } from '@/types/models';
export function ManagementOrderActions({ order }: { order: Order }) {
  const [save, result] = useManagementOrderStatusMutation();
  return (
    <StatusEditor order={order} saving={result.isLoading} save={(value) => save(value).unwrap()} />
  );
}
