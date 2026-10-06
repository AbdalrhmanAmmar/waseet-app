import { hasReference } from './external-order-policy';
import type { Order, DeliveryArea } from '@/types/models';
import { deliveryMode, type DeliveryMode } from './order-workflow';
import { orderStatusPresentation } from './order-status-presentation';
export type DeliveryFilter = 'all' | 'internal' | 'external';
export function resolveDeliveryMode(order: Order, areas: DeliveryArea[]): DeliveryMode {
  if (hasReference(order.oliveryOrderId) || hasReference(order.oliverySequence)) return 'external';
  const stored = order.deliveryMode?.trim().toLowerCase();
  return stored === 'internal' || stored === 'external'
    ? stored
    : deliveryMode(order.customerArea, areas);
}
export function filterByDelivery(
  orders: Order[],
  areas: DeliveryArea[],
  mode: DeliveryFilter,
  statuses: string[],
  localStatuses: string[] = [],
) {
  return orders.filter((order) => {
    const resolved = resolveDeliveryMode(order, areas);
    if (mode !== 'all' && mode !== resolved) return false;
    const raw = mode === 'external' ? order.oliveryStatus : order.status;
    const matches = (selected: string[], value: string | null | undefined, source: DeliveryMode) =>
      !selected.length ||
      selected.some(
        (code) =>
          code === value ||
          orderStatusPresentation(code, source).label ===
            orderStatusPresentation(value, source).label,
      );
    return (
      matches(statuses, raw, mode === 'external' ? 'external' : 'internal') &&
      matches(localStatuses, order.status, 'internal')
    );
  });
}
