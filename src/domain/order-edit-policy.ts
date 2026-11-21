import type { Order } from '@/types/models';
import { type OrderActor } from './internal-order-policy';
import {
  actorActive,
  canEditExternal,
  externalEditWindowOpen,
  hasReference,
  inCompany,
} from './external-order-policy';
import { normalizeStatus, type DeliveryMode } from './order-workflow';

// Implements the "When Order Details Can Be Modified" sheet (PUT orders/{id}).
// - ManagementEmployee: internal in any status; external within the provider window.
// - "Any other role" = Merchant, MerchantEmployee, SalesEmployee, each on their own orders:
//   internal only while Processing or Stuck; external within the same provider window.
export const ORDER_EDITORS = [
  'ManagementEmployee',
  'Merchant',
  'MerchantEmployee',
  'SalesEmployee',
] as const;
export const canEditOrders = (role: unknown) =>
  (ORDER_EDITORS as readonly unknown[]).includes(role);
const INTERNAL_OWNER_STATUSES = ['processing', 'stuck'];

/** Why this actor may not edit someone else's order, or null when the order is theirs. */
export function orderOwnershipReason(order: Order, actor: OrderActor): string | null {
  // An employee-created order carries the owner merchant in userId and the employee here.
  const employee = actor.role === 'MerchantEmployee';
  const owner = employee ? order.createdByMerchantEmployeeId : order.userId;
  if (!hasReference(owner))
    // Employees share one merchant's orders, so an unknown creator is never assumed (fail closed).
    // Merchant and sales responses may omit userId; their order lists are already scoped to them
    // by the server, which stays the final authority on PUT.
    return employee ? 'تعذر التحقق من منشئ الطلب. حدّث بيانات الطلب قبل التعديل.' : null;
  if (!hasReference(actor.userId) || String(owner) !== String(actor.userId))
    return actor.role === 'Merchant'
      ? 'يمكنك تعديل طلبات حسابك فقط.'
      : 'يمكنك تعديل الطلبات التي أنشأتها فقط.';
  return null;
}

export function orderEditDecision(order: Order, actor: OrderActor | null, mode: DeliveryMode) {
  const no = (reason: string) => ({ allowed: false, reason });
  if (!actor || !canEditOrders(actor.role)) return no('تعديل بيانات الطلب غير متاح لحسابك.');
  if (!actorActive(actor)) return no('الحساب غير نشط؛ تعديل الطلب غير متاح.');
  if (mode === 'unknown') return no('تعذر تحديد جهة التوصيل. حدّث بيانات الطلب قبل التعديل.');
  if (normalizeStatus(order.orderType) === 'return')
    return no('بيانات طلب المرتجع للعرض فقط. استخدم إجراءات المرتجع لمتابعته.');
  const management = actor.role === 'ManagementEmployee';
  if (!management) {
    const owner = orderOwnershipReason(order, actor);
    if (owner) return no(owner);
  }
  if (mode === 'internal') {
    // Internal mode already excludes Olivery-routed orders, and the API may omit the
    // Olivery fields entirely on internal orders, so they are not required here.
    if (normalizeStatus(order.orderType) !== 'normal')
      return no('بيانات نوع الطلب غير مكتملة. حدّث الطلب قبل التعديل.');
    if (management) return { allowed: true, reason: 'يمكن تعديل بيانات الطلب الداخلي في أي حالة.' };
    if (!INTERNAL_OWNER_STATUSES.includes(normalizeStatus(order.status)))
      return no(
        'تعديل الطلب الداخلي متاح في حالتي «قيد المعالجة» و«عالق» فقط؛ بعد تأكيد الطلب تُقفل تفاصيله.',
      );
    return { allowed: true, reason: 'التعديل متاح قبل تأكيد الطلب.' };
  }
  if (inCompany(order)) return no('الطلب موجود في الشركة (In_Company) — لا يمكن تعديل تفاصيله.');
  if (management ? canEditExternal(order, actor, mode) : externalEditWindowOpen(order))
    return { allowed: true, reason: 'التعديل متاح وفق حالة الطلب أو حالة زحل الخام.' };
  return no(
    order.oliveryStatus?.trim()
      ? 'انتهت نافذة تعديل الطلب لدى شركة التوصيل.'
      : 'حالة زحل الخام غير متوفرة للتحقق من نافذة التعديل. حدّث بيانات الطلب.',
  );
}
