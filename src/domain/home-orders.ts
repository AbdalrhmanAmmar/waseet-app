import type { Order } from '@/types/models';
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
