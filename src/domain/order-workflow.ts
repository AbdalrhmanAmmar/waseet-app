import type { DeliveryArea, Order, OrderInput } from '@/types/models';
export type DeliveryMode = 'internal' | 'external' | 'unknown';
export type StatusDefinition = { status: string; isTerminal: boolean };
export const normalizeStatus = (v: unknown) =>
  String(v ?? '')
    .trim()
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
const normalizeArea = (v: unknown) =>
  String(v ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ')
    .toLowerCase();
export function deliveryMode(area: string | undefined, areas: DeliveryArea[]): DeliveryMode {
  const key = normalizeArea(area);
  if (!key) return 'unknown';
  const matches = areas.filter(
    (a) =>
      normalizeArea(a.city) === key ||
      (a.oliveryAreaName && normalizeArea(a.oliveryAreaName) === key),
  );
  if (!matches.length || matches.some((a) => typeof a.isInternalDelivery !== 'boolean'))
    return 'unknown';
  if (matches.every((a) => a.isInternalDelivery === true)) return 'internal';
  if (matches.every((a) => a.isInternalDelivery === false)) return 'external';
  return 'unknown';
}
const transitions: Record<string, readonly string[]> = {
  pending: ['processing', 'cancelled', 'stuck'],
  processing: ['confirmed', 'cancelled', 'stuck'],
  confirmed: ['outfordelivery', 'cancelled', 'stuck'],
  outfordelivery: ['delivered', 'refusedondelivery', 'postponed', 'stuck'],
  postponed: ['outfordelivery', 'cancelled', 'stuck'],
  delivered: ['closed'],
  refusedondelivery: ['closed'],
  stuck: ['processing'],
  cancelled: [],
  closed: [],
};
export function terminalStatus(status: string, definitions?: StatusDefinition[]) {
  const key = normalizeStatus(status);
  return (
    ['cancelled', 'closed'].includes(key) ||
    definitions?.find((d) => normalizeStatus(d.status) === key)?.isTerminal === true
  );
}
export function transitionReason(
  mode: DeliveryMode,
  from: string,
  to: string,
  definitions: StatusDefinition[],
): string | null {
  const source = normalizeStatus(from),
    target = normalizeStatus(to);
  if (mode === 'unknown') return 'تعذر تحديد جهة التوصيل. أعد تحميل مناطق التوصيل.';
  if (!definitions.some((d) => normalizeStatus(d.status) === target))
    return 'الحالة غير موجودة في قائمة الخادم.';
  if (terminalStatus(from, definitions)) return 'هذا الطلب في حالة نهائية';
  if (!transitions[source]?.includes(target)) return 'هذا الانتقال غير متاح من الحالة الحالية.';
  if (
    mode === 'external' &&
    !(source === 'processing' && ['confirmed', 'stuck'].includes(target)) &&
    !(source === 'stuck' && target === 'processing')
  )
    return 'مراحل التوصيل اللاحقة تديرها جهة التوصيل الخارجية.';
  return null;
}
export function transitionOptions(
  mode: DeliveryMode,
  status: string,
  definitions: StatusDefinition[],
) {
  const seen = new Set<string>();
  return definitions
    .filter((d) => {
      const key = normalizeStatus(d.status);
      if (seen.has(key) || key === normalizeStatus(status)) return false;
      seen.add(key);
      return (
        mode !== 'external' ||
        (normalizeStatus(status) === 'stuck'
          ? key === 'processing'
          : ['confirmed', 'stuck'].includes(key))
      );
    })
    .map((d) => ({ ...d, reason: transitionReason(mode, status, d.status, definitions) }));
}
export const requiresStatusNote = (from: string, to: string) =>
  normalizeStatus(from) === 'stuck' || normalizeStatus(to) === 'stuck';
export const orderVersion = (order: Order) =>
  JSON.stringify([
    order.orderId,
    order.status,
    order.customerName,
    order.customerMobile,
    order.customerArea,
    order.customerAddress,
    order.deliveryFee,
    order.orderTotalUSD,
    order.updatedAt,
    order.items.map((i) => [i.productCode, i.quantity, i.actualSellPriceUSD, i.color]),
  ]);
export function validateOrderUpdate(input: OrderInput) {
  if (input.customerName.trim().length < 2) return 'اسم العميل مطلوب.';
  if (!/^09\d{8}$/.test(input.customerMobile))
    return 'رقم الهاتف السوري يبدأ بـ 09 ويتكون من 10 أرقام.';
  if (input.customerAddress.trim().length < 4) return 'أدخل عنوانًا تفصيليًا.';
  if (!input.customerArea.trim()) return 'اختر منطقة التوصيل.';
  if (!input.items.length) return 'أضف منتجًا واحدًا على الأقل.';
  const seen = new Set<number>();
  for (const row of input.items) {
    if (!Number.isSafeInteger(row.productCode) || row.productCode <= 0)
      return 'أدخل كود منتج صحيحًا.';
    if (seen.has(row.productCode)) return 'لا يمكن تكرار نفس المنتج داخل الطلب.';
    seen.add(row.productCode);
    if (!Number.isSafeInteger(row.quantity) || row.quantity < 1)
      return 'الكمية يجب أن تكون عددًا صحيحًا موجبًا.';
    if (
      !Number.isFinite(row.actualSellPriceUSD) ||
      row.actualSellPriceUSD <= 0 ||
      Math.abs(row.actualSellPriceUSD * 100 - Math.round(row.actualSellPriceUSD * 100)) > 0.000001
    )
      return 'أدخل سعر بيع موجبًا بمنزلتين عشريتين كحد أقصى.';
    if (!row.color.trim() || row.color.trim().length > 50)
      return 'لون المنتج مطلوب ولا يتجاوز 50 حرفًا.';
  }
  return null;
}
export function mutationError(error: unknown) {
  const e = error as { status?: number | string; message?: string } | null;
  if (e?.status === 403)
    return 'الخادم لا يسمح لحسابك بتنفيذ هذا الإجراء حاليًا. لم يتم حفظ التغيير.';
  return e?.message || 'تعذر حفظ التغيير. حاول مرة أخرى.';
}
