import type { Order } from '@/types/models';
import { shipmentCode } from './external-order-policy';
import { normalizeStatus } from './order-workflow';
export function periodBounds(days: number, now = new Date()) {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days + 1);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}
export function dailyOrders(orders: Order[], from: string, days: number) {
  const start = new Date(from);
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return { date, key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`, count: 0 };
  });
  for (const order of orders) {
    const date = new Date(order.createdAt ?? '');
    if (!Number.isFinite(date.getTime())) throw new Error('تواريخ بعض الطلبات غير متاحة');
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const bucket = buckets.find((row) => row.key === key);
    if (!bucket) throw new Error('استجابة الطلبات لا تطابق الفترة المطلوبة');
    bucket.count++;
  }
  return buckets;
}
// Analytics must never infer completeness from one page or silently discard duplicates.
export function orderPage(raw: any) {
  const body = raw?.data ?? raw;
  if (
    !body ||
    !Array.isArray(body.items) ||
    !Number.isInteger(body.totalCount) ||
    body.totalCount < 0 ||
    !Number.isInteger(body.totalPages) ||
    body.totalPages < 0
  )
    throw new Error('بيانات إحصائيات الطلبات غير مكتملة');
  return body as { items: Order[]; totalCount: number; totalPages: number; page?: number };
}

// Home counters classify each order by what actually happened to it, reading the local
// Order.Status for internal orders and the Olivery state for shipped external orders
// (an external Order.Status never reaches Delivered/Refused/Postponed).
export const ORDER_OUTCOMES = [
  'processing',
  'delivered',
  'refused',
  'stuck',
  'cancelled',
  'postponed',
] as const;
export type OrderOutcome = (typeof ORDER_OUTCOMES)[number];
const BY_OLIVERY: Record<string, OrderOutcome> = {
  delivered: 'delivered',
  delivered_with_return: 'delivered',
  // Cash-collection states only follow a delivery.
  money_received: 'delivered',
  money_in: 'delivered',
  money_out: 'delivered',
  paid: 'delivered',
  completed: 'delivered',
  rejected: 'refused',
  stuck: 'stuck',
  canceled: 'cancelled',
  reschedule: 'postponed',
};
const BY_STATUS: Record<string, OrderOutcome> = {
  processing: 'processing',
  delivered: 'delivered',
  completed: 'delivered',
  refusedondelivery: 'refused',
  stuck: 'stuck',
  cancelled: 'cancelled',
  postponed: 'postponed',
};
export function orderOutcome(
  order: Pick<Order, 'status' | 'oliveryStatus' | 'orderType'>,
): OrderOutcome | null {
  // Return orders run their own lifecycle and are not sales outcomes.
  if (normalizeStatus(order.orderType) === 'return') return null;
  const shipment = order.oliveryStatus?.trim();
  if (shipment) {
    const byShipment = BY_OLIVERY[shipmentCode(shipment)];
    if (byShipment) return byShipment;
  }
  // Completed_return is deliberately unclassified: it may close a cancelled or a refused order.
  return BY_STATUS[normalizeStatus(order.status)] ?? null;
}
export function outcomeCounts(orders: Pick<Order, 'status' | 'oliveryStatus' | 'orderType'>[]) {
  const counts = Object.fromEntries(ORDER_OUTCOMES.map((key) => [key, 0])) as Record<
    OrderOutcome,
    number
  >;
  for (const order of orders) {
    const outcome = orderOutcome(order);
    if (outcome) counts[outcome]++;
  }
  return counts;
}
