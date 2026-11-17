import type { Order } from '@/types/models';
import { type OrderActor } from './internal-order-policy';
import { actorActive, canEditExternal, inCompany } from './external-order-policy';
import { normalizeStatus, type DeliveryMode } from './order-workflow';
export function orderEditDecision(order: Order, actor: OrderActor | null, mode: DeliveryMode) {
  const no = (reason: string) => ({ allowed: false, reason });
  if (actor?.role !== 'ManagementEmployee') return no('تعديل بيانات الطلب متاح لموظف الإدارة فقط.');
  if (!actorActive(actor)) return no('الحساب غير نشط؛ تعديل الطلب غير متاح.');
  if (mode === 'unknown') return no('تعذر تحديد جهة التوصيل. حدّث بيانات الطلب قبل التعديل.');
  if (normalizeStatus(order.orderType) === 'return')
    return no('بيانات طلب المرتجع للعرض فقط. استخدم إجراءات المرتجع لمتابعته.');
  if (mode === 'internal') {
    if (order.oliveryOrderId !== null || normalizeStatus(order.orderType) !== 'normal')
      return no('بيانات نوع الطلب أو جهة التوصيل غير مكتملة. حدّث الطلب قبل التعديل.');
    return { allowed: true, reason: 'يمكن تعديل بيانات الطلب الداخلي في أي حالة.' };
  }
  if (inCompany(order)) return no('الطلب موجود في الشركة (In_Company) — لا يمكن تعديل تفاصيله.');
  if (canEditExternal(order, actor, mode))
    return { allowed: true, reason: 'التعديل متاح وفق حالة الطلب أو حالة زحل الخام.' };
  return no(
    order.oliveryStatus?.trim()
      ? 'انتهت نافذة تعديل الطلب لدى شركة التوصيل.'
      : 'حالة زحل الخام غير متوفرة للتحقق من نافذة التعديل. حدّث بيانات الطلب.',
  );
}
