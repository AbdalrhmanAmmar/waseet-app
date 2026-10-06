import type { Order } from '@/types/models';
import { type OrderActor } from './internal-order-policy';
import type { DeliveryMode as OrderDeliveryMode } from './order-workflow';
import { normalizeStatus as normalizeOrderStatus } from './order-workflow';
export type InternalReturnInput = {
  items: { orderItemId: number; quantity: number; returnPriceUSD: number; color: string }[];
};
const isReturnOrderType = (value: unknown) => String(value).toLowerCase() === 'return';

export function internalReturnDecision(
  order: Order,
  mode: OrderDeliveryMode,
  actor: OrderActor | null,
) {
  const no = (reason: string, unknown = false) => ({ allowed: false, reason, unknown });
  if (actor?.role !== 'ManagementEmployee') return no('إنشاء المرتجع متاح لموظف الإدارة فقط.');
  if (
    ['pending', 'rejected', 'suspended', 'blocked', 'inactive', 'disabled'].includes(
      actor.accountStatus?.toLowerCase() ?? '',
    )
  )
    return no('الحساب غير نشط؛ لا يمكن إنشاء مرتجع حاليًا.');
  if (isReturnOrderType(order.orderType)) return no('لا يمكن إنشاء مرتجع من طلب مرتجع.');
  if (mode === 'external') return no('هذه العملية مخصصة للطلبات الداخلية.');
  if (mode === 'unknown') return no('تعذر تحديد نوع توصيل الطلب. حدّث البيانات للتحقق.', true);
  if (order.oliveryOrderId === undefined)
    return no('بيانات ربط الطلب بشركة التوصيل غير متوفرة. حدّث الطلب للتحقق من أنه داخلي.', true);
  if (order.oliveryOrderId !== null)
    return no('الطلب مرتبط بشركة التوصيل؛ لا يمكن إنشاء مرتجع داخلي له.');
  if (
    order.isReturnProcessed === true ||
    order.items.some((item) => Number(item.returnedQuantity ?? 0) > 0)
  )
    return no(
      'سبق إنشاء أو تسجيل مرتجع لهذا الطلب، ولا يمكن إنشاء مرتجع آخر حتى لو كان الأول جزئيًا.',
    );
  if (normalizeOrderStatus(order.status) !== 'delivered')
    return no(
      normalizeOrderStatus(order.status) === 'completed'
        ? 'تم إكمال طلب البيع. إنشاء المرتجع متاح في حالة «تم التسليم» فقط.'
        : 'إنشاء المرتجع متاح عندما تكون حالة الطلب «تم التسليم».',
    );
  if (normalizeOrderStatus(order.orderType) !== 'normal')
    return no('إنشاء المرتجع متاح للطلبات من النوع Normal فقط.', !order.orderType);
  if (
    !order.items.length ||
    new Set(order.items.map((item) => Number(item.orderItemId))).size !== order.items.length ||
    order.items.some(
      (item) =>
        !Number.isSafeInteger(Number(item.orderItemId)) ||
        Number(item.orderItemId) <= 0 ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0,
    )
  )
    return no(
      'بيانات بنود الطلب غير مكتملة أو تحتوي على معرفات مكررة. يلزم تحديثها قبل إنشاء المرتجع.',
      true,
    );
  return {
    allowed: true,
    reason: 'أنشئ مرتجعًا كاملًا أو جزئيًا مرتبطًا بهذا الطلب.',
    unknown: false,
  };
}
export type ReturnDraft = Record<
  number,
  { selected: boolean; quantity: string; price: string; color: string }
>;
export const createReturnDraft = (order: Order): ReturnDraft =>
  Object.fromEntries(
    order.items.map((item) => [
      Number(item.orderItemId),
      {
        selected: false,
        quantity: String(item.quantity),
        price: '',
        color: String(item.color ?? '').trim(),
      },
    ]),
  );
export function validateReturnDraft(order: Order, draft: ReturnDraft) {
  const errors: Record<string, string> = {};
  const items: InternalReturnInput['items'] = [];
  const seen = new Set<number>();
  for (const item of order.items) {
    const row = draft[Number(item.orderItemId)];
    if (!row?.selected) continue;
    if (seen.has(Number(item.orderItemId))) errors.form = 'لا يمكن تكرار معرف بند الطلب.';
    seen.add(Number(item.orderItemId));
    const quantity = Number(row.quantity),
      price = Number(row.price);
    if (
      !row.quantity.trim() ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > Number(item.quantity) ||
      quantity > 2147483647
    )
      errors[String(item.orderItemId) + '.quantity'] =
        'أدخل كمية صحيحة من 1 إلى ' + item.quantity + '.';
    // Retain the existing nonnegative input rule; Swagger supplies no maximum or decimal scale.
    // Zero is distinct from empty. Server validation remains authoritative.
    if (
      !row.price.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(price * quantity)
    )
      errors[String(item.orderItemId) + '.price'] =
        'أدخل سعر إرجاع صالحًا بالدولار؛ الحقل الفارغ ليس صفرًا.';
    const color = row.color?.trim() ?? '';
    if (!color) errors[String(item.orderItemId) + '.color'] = 'أدخل لون البند المطلوب إرجاعه.';
    items.push({ orderItemId: Number(item.orderItemId), quantity, returnPriceUSD: price, color });
  }
  if (items.length && !Number.isFinite(returnItemsTotal(items)))
    errors.form = 'إجمالي قيمة الإرجاع غير صالح. راجع الأسعار والكميات.';
  if (!items.length) errors.form = 'اختر بندًا واحدًا على الأقل للإرجاع.';
  return { errors, body: { items }, valid: Object.keys(errors).length === 0 };
}
export const returnSourceSnapshot = (order: Order) =>
  JSON.stringify({
    customerName: order.customerName,
    customerMobile: order.customerMobile,
    secondCustomerPhone: order.secondCustomerPhone,
    customerArea: order.customerArea,
    customerAddress: order.customerAddress,
    items: order.items
      .map((item) => [
        item.orderItemId,
        item.productCode,
        item.color,
        item.quantity,
        item.actualSellPriceUSD,
        item.originalPriceUSD,
        item.merchantSellPriceUSD,
        item.returnedQuantity,
      ])
      .sort((a, b) => Number(a[0]) - Number(b[0])),
  });
export function createdInternalReturnId(
  value: unknown,
  originalId: string | number,
): number | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = Number(row.orderId ?? row.order_id);
  return Number.isSafeInteger(id) &&
    id > 0 &&
    String(id) !== String(originalId) &&
    String(row.originalOrderId ?? row.original_order_id ?? row.OriginalOrderId) ===
      String(originalId) &&
    isReturnOrderType(row.orderType ?? row.order_type ?? row.OrderType)
    ? id
    : null;
}

export const returnSettlementSnapshot = (order: Order) =>
  JSON.stringify([
    returnSourceSnapshot(order),
    order.totalAdminProfitUSD,
    order.totalMerchantProfitUSD,
  ]);

// Decimal arithmetic for the preview only: avoid 105.1 * 3 displaying 315.29999999999995.
// The unit prices sent to the API are unchanged; no currency scale is imposed.
export function returnItemsTotal(items: { quantity: number; returnPriceUSD: number }[]) {
  let total = 0n,
    scale = 0;
  for (const item of items) {
    if (!Number.isFinite(item.returnPriceUSD) || !Number.isSafeInteger(item.quantity)) return NaN;
    const [mantissa, exponent = '0'] = String(item.returnPriceUSD).toLowerCase().split('e');
    const [whole, fraction = ''] = mantissa.split('.');
    const itemScale = fraction.length - Number(exponent);
    let amount = BigInt(whole + fraction) * BigInt(item.quantity);
    const nextScale = Math.max(scale, itemScale, 0);
    total *= 10n ** BigInt(nextScale - scale);
    amount *= 10n ** BigInt(nextScale - itemScale);
    total += amount;
    scale = nextScale;
  }
  const sign = total < 0n ? '-' : '';
  const digits = (total < 0n ? -total : total).toString().padStart(scale + 1, '0');
  return Number(sign + (scale ? digits.slice(0, -scale) + '.' + digits.slice(-scale) : digits));
}
