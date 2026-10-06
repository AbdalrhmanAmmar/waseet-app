import type { Order } from '@/types/models';
import { oliveryTitleCode } from './olivery-status';
import type { DeliveryMode } from './order-workflow';
import { normalizeStatus } from './order-workflow';
import { isManagement, type OrderActor } from './internal-order-policy';
import { EXTERNAL_DELIVERY_STATUSES } from './order-status-presentation';
export const hasReference = (v: unknown) =>
  typeof v === 'number'
    ? Number.isFinite(v) && v > 0
    : typeof v === 'string' && !!v.trim() && v.trim() !== '0';
export const hasShipment = (o: Order) =>
  hasReference(o.oliveryOrderId) || hasReference(o.oliverySequence) || !!o.oliveryStatus?.trim();
export const actorActive = (a?: OrderActor | null) =>
  !!a &&
  ['Merchant', 'MerchantEmployee', 'SalesEmployee', 'DeliveryAgent', 'ManagementEmployee'].includes(
    a.role,
  ) &&
  !['pending', 'rejected', 'suspended', 'blocked', 'inactive', 'disabled'].includes(
    a.accountStatus?.toLowerCase() ?? '',
  );
export function shipmentCode(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  const alias = oliveryTitleCode(text);
  if (alias) return alias;
  return (
    Object.entries(EXTERNAL_DELIVERY_STATUSES).find(
      ([code, entry]) => normalizeStatus(code) === normalizeStatus(text) || entry.label === text,
    )?.[0] ?? text
  );
}
export function externalTargets(
  o: Order,
  actor: OrderActor | null | undefined,
  mode: DeliveryMode,
) {
  if (mode !== 'external' || !actorActive(actor) || normalizeStatus(o.orderType) === 'return')
    return [];
  const management = isManagement(actor),
    status = normalizeStatus(o.status);
  const targets: string[] = [];
  if (status === 'processing' && management) targets.push('Confirmed', 'Stuck');
  if (
    status === 'stuck' &&
    (management ||
      (['Merchant', 'MerchantEmployee', 'SalesEmployee'].includes(actor!.role) &&
        hasReference(o.userId) &&
        hasReference(actor!.role === 'MerchantEmployee' ? actor!.ownerMerchantId : actor!.userId) &&
        String(o.userId) ===
          String(actor!.role === 'MerchantEmployee' ? actor!.ownerMerchantId : actor!.userId)))
  )
    targets.push('Processing');
  if (status === 'confirmed' && management) targets.push('Printed Confirmed');
  if (
    ['processing', 'stuck', 'confirmed'].includes(status) ||
    (status === 'printedconfirmed' && management)
  )
    targets.push('Cancelled');
  return targets;
}
export function externalActionReason(o: Order, target: string) {
  const key = normalizeStatus(target);
  if (key === 'confirmed' && hasShipment(o))
    return 'توجد شحنة مرتبطة بالفعل؛ حدّث التفاصيل قبل محاولة التأكيد.';
  if (key === 'printedconfirmed' && !hasReference(o.oliverySequence))
    return 'رقم تسلسل الشحنة غير متاح؛ حدّث التفاصيل قبل اعتماد الطباعة.';
  return null;
}
export function canEditExternal(
  o: Order,
  actor: OrderActor | null | undefined,
  mode: DeliveryMode,
) {
  return (
    mode === 'external' &&
    actorActive(actor) &&
    isManagement(actor) &&
    (['processing', 'stuck', 'confirmed'].includes(normalizeStatus(o.status)) ||
      ['waiting', 'printing_waiting'].includes(shipmentCode(o.oliveryStatus)))
  );
}
export const externalActionCopy: Record<string, { label: string; effect: string }> = {
  confirmed: {
    label: 'تأكيد وإرسال الشحنة',
    effect: 'سيتم إنشاء الشحنة لدى شركة التوصيل. تأكد من بيانات العميل والمنتجات قبل التأكيد.',
  },
  stuck: { label: 'تعليق الطلب', effect: 'حفظ سبب التعليق دون إرسال الشحنة.' },
  processing: { label: 'حل التعثر', effect: 'إعادة الطلب إلى قيد المعالجة مع حفظ ملاحظة الحل.' },
  printedconfirmed: {
    label: 'اعتماد طباعة البوليصة',
    effect:
      'نفّذ هذه الخطوة بعد الطباعة فعليًا. تنزيل البوليصة وحده لا يعتمد الطباعة لدى شركة التوصيل.',
  },
  cancelled: {
    label: 'إلغاء الطلب',
    effect:
      'إذا أُرسلت الشحنة، يخضع الإلغاء لموافقة شركة التوصيل. سنعرض الحالة الفعلية بعد الاستجابة.',
  },
};
export type ExternalReturnInput = { items: { orderItemId: number; quantity: number }[] };
export const returnProcessed = (o: Order) =>
  o.isReturnProcessed === true ||
  o.items.some((i) => typeof i.returnedQuantity === 'number' && i.returnedQuantity > 0);
// Access checks before live synchronization must not reject stale shipment/credit flags.
export function externalReturnAccessReason(
  o: Order,
  actor: OrderActor | null | undefined,
  mode: DeliveryMode,
) {
  if (!actorActive(actor) || !isManagement(actor)) return 'معالجة المرتجع متاحة للإداري فقط.';
  if (mode !== 'external' || normalizeStatus(o.orderType) === 'return')
    return 'تتم المعالجة على الطلب الخارجي الأصلي.';
  if (!hasReference(o.oliveryOrderId))
    return 'معرف شحنة زحل غير متوفر. حدّث بيانات الطلب قبل المعالجة.';
  return null;
}
export function externalReturnReason(
  o: Order,
  actor: OrderActor | null | undefined,
  mode: DeliveryMode,
) {
  const access = externalReturnAccessReason(o, actor, mode);
  if (access) return access;
  if (returnProcessed(o)) return 'تم تسجيل مرتجع لهذا الطلب بالفعل.';
  if (o.isCredited === false)
    return 'لم تُضف أرصدة الطلب بعد؛ لا يمكن معالجة المرتجع قبل تأكيد إضافة الرصيد.';
  if (o.canProcessReturn === false) return 'معالجة المرتجع غير متاحة لهذا الطلب حاليًا.';
  if (shipmentCode(o.oliveryStatus) !== 'delivered_with_return')
    return 'تتاح المعالجة عند التسليم مع مرتجع جزئي.';
  if (
    !o.items.length ||
    new Set(o.items.map((i) => i.orderItemId)).size !== o.items.length ||
    o.items.some(
      (i) =>
        typeof i.orderItemId !== 'number' ||
        !Number.isSafeInteger(i.orderItemId) ||
        i.orderItemId <= 0 ||
        typeof i.quantity !== 'number' ||
        !Number.isSafeInteger(i.quantity) ||
        i.quantity <= 0 ||
        (i.returnedQuantity != null &&
          (typeof i.returnedQuantity !== 'number' ||
            !Number.isSafeInteger(i.returnedQuantity) ||
            i.returnedQuantity < 0 ||
            i.returnedQuantity > i.quantity)),
    )
  )
    return 'بيانات بنود الطلب غير مكتملة أو غير متسقة.';
  return null;
}
export function validateExternalReturn(o: Order, body: ExternalReturnInput) {
  if (
    !body.items.length ||
    new Set(body.items.map((i) => i.orderItemId)).size !== body.items.length
  )
    return 'اختر منتجات دون تكرار بنود الطلب.';
  for (const row of body.items) {
    const item = o.items.find((i) => i.orderItemId === row.orderItemId);
    if (
      !item ||
      typeof item.quantity !== 'number' ||
      !Number.isSafeInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity > item.quantity ||
      row.quantity > 2147483647
    )
      return 'الكمية المرتجعة يجب أن تكون عددًا صحيحًا من 1 إلى كمية البند الأصلية.';
  }
  return null;
}
export const externalReturnSnapshot = (o: Order) =>
  JSON.stringify([
    o.orderId,
    o.customerArea,
    o.userId,
    o.totalMerchantProfitUSD,
    o.isStockDecremented,
    o.items.map((i) => [
      i.orderItemId,
      i.productCode,
      i.quantity,
      i.color,
      i.merchantProfitUSD,
      i.adminProfitUSD,
      i.returnedQuantity,
    ]),
  ]);

export const externalTerminal = (status: string) => normalizeStatus(status) === 'cancelled';
