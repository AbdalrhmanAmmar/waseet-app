import type { Order, User } from '@/types/models';
import type { DeliveryMode } from './order-workflow';
import { normalizeStatus } from './order-workflow';
export type OrderActor = {
  role: string;
  userId: unknown;
  ownerMerchantId?: unknown;
  accountStatus?: string;
};
export const internalTerminal = (status: string) =>
  ['completed', 'completedreturn', 'completedreturned', 'closed'].includes(normalizeStatus(status));
const normal: Record<string, string[]> = {
  processing: ['Confirmed', 'Stuck', 'Cancelled'],
  confirmed: ['Ready for Dispatch', 'Out for Delivery', 'Cancelled'],
  readyfordispatch: ['Out for Delivery', 'Cancelled'],
  outfordelivery: ['Delivered', 'Refused on Delivery', 'Postponed', 'Stuck', 'Cancelled'],
  postponed: ['Out for Delivery', 'Cancelled'],
  stuck: ['Processing', 'Cancelled'],
  delivered: ['Completed'],
  cancelled: ['Completed_return'],
  // Customer took it after all, or management cancels it; both refund a deducted delivery fee.
  refusedondelivery: ['Delivered', 'Cancelled', 'Completed_return'],
};
const returns: Record<string, string[]> = {
  processing: ['Confirmed'],
  confirmed: ['returned_in_progress'],
  returnedinprogress: ['returned_delivered'],
  returneddelivered: ['completed_returned'],
};
export function internalContextValid(order: Order, mode: DeliveryMode) {
  return (
    mode === 'internal' && ['normal', 'return'].includes(String(order.orderType).toLowerCase())
  );
}
export function isManagement(actor: OrderActor | null | undefined) {
  return actor?.role === 'ManagementEmployee';
}
export function canEditInternal(
  order: Order,
  actor: OrderActor | null | undefined,
  mode: DeliveryMode,
) {
  return (
    internalContextValid(order, mode) &&
    isManagement(actor) &&
    !['pending', 'rejected', 'suspended', 'blocked', 'inactive', 'disabled'].includes(
      actor?.accountStatus?.toLowerCase() ?? '',
    )
  );
}
export function internalTargets(
  order: Order,
  actor: OrderActor | null | undefined,
  mode: DeliveryMode,
): string[] {
  if (
    !actor ||
    !internalContextValid(order, mode) ||
    ['pending', 'rejected', 'suspended', 'blocked', 'inactive', 'disabled'].includes(
      actor.accountStatus?.toLowerCase() ?? '',
    )
  )
    return [];
  const role = actor.role;
  if (
    ![
      'Merchant',
      'MerchantEmployee',
      'SalesEmployee',
      'DeliveryAgent',
      'ManagementEmployee',
    ].includes(role)
  )
    return [];
  const returning = String(order.orderType).toLowerCase() === 'return';
  const from = normalizeStatus(order.status);
  const targets = (returning ? returns : normal)[from] ?? [];
  const management = isManagement(actor);
  const delivery = role === 'DeliveryAgent';
  return targets.filter((target) => {
    const to = normalizeStatus(target);
    if (returning) {
      if (order.isReturnFinalized === true) return false;
      return management || (delivery && ['returnedinprogress', 'returneddelivered'].includes(to));
    }
    if (management) return true;
    // Cancelling a refused order refunds the merchant's delivery fee: management only.
    if (to === 'cancelled') return from !== 'refusedondelivery';
    if (from === 'stuck' && to === 'processing')
      return ['Merchant', 'MerchantEmployee', 'SalesEmployee'].includes(role);
    return (
      delivery &&
      ((from === 'outfordelivery' &&
        ['delivered', 'refusedondelivery', 'postponed', 'stuck'].includes(to)) ||
        (from === 'refusedondelivery' && to === 'delivered'))
    );
  });
}
export const actorFromUser = (user: User | null): OrderActor | null =>
  user
    ? {
        role: user.role,
        userId: user.userId,
        ownerMerchantId: user.ownerMerchantId,
        accountStatus: user.accountStatus ?? user.status,
      }
    : null;
export const internalActionCopy: Record<
  string,
  {
    label: string;
    effect: string;
    icon:
      | 'check-circle-outline'
      | 'truck-outline'
      | 'pause-circle-outline'
      | 'close-circle-outline'
      | 'package-variant-closed';
  }
> = {
  confirmed: {
    label: 'تأكيد الطلب',
    effect: 'اعتماد الطلب للمرحلة التالية.',
    icon: 'check-circle-outline',
  },
  readyfordispatch: {
    label: 'تجهيز للتوصيل',
    effect: 'مرحلة اختيارية قبل إخراج الطلب للتوصيل.',
    icon: 'package-variant-closed',
  },
  outfordelivery: {
    label: 'إخراج للتوصيل',
    effect: 'تُخصم كميات الطلب من المخزون إن لم تكن قد خُصمت سابقًا.',
    icon: 'truck-outline',
  },
  delivered: {
    label: 'تسجيل التسليم',
    effect: 'تأكد من استلام العميل؛ تُحتسب الأرباح المستحقة عند التسليم.',
    icon: 'check-circle-outline',
  },
  refusedondelivery: {
    label: 'رفض الاستلام',
    effect: 'قد تخصم رسوم التوصيل من التاجر. لا يعود المخزون حتى الإغلاق كراجع.',
    icon: 'close-circle-outline',
  },
  postponed: {
    label: 'تأجيل التوصيل',
    effect: 'يصبح الطلب متاحًا لمحاولة توصيل لاحقة.',
    icon: 'pause-circle-outline',
  },
  stuck: {
    label: 'تعليق الطلب',
    effect: 'أضف سبب التعليق ليتابعه المسؤول عن الطلب.',
    icon: 'pause-circle-outline',
  },
  processing: {
    label: 'حل العالق',
    effect: 'تعود الحالة إلى قيد المعالجة. ملاحظة الحل مطلوبة.',
    icon: 'check-circle-outline',
  },
  cancelled: {
    label: 'إلغاء الطلب',
    effect: 'الإلغاء لا يعيد المخزون. استعادته تتم عند الإغلاق كراجع.',
    icon: 'close-circle-outline',
  },
  completed: {
    label: 'إكمال الطلب',
    effect: 'إغلاق البيع المسلم نهائيًا دون إعادة المخزون.',
    icon: 'check-circle-outline',
  },
  completedreturn: {
    label: 'إغلاق كراجع',
    effect: 'تُستعاد الكميات التي سبق خصمها، وتصبح الحالة نهائية.',
    icon: 'package-variant-closed',
  },
  returnedinprogress: {
    label: 'بدء نقل المرتجع',
    effect: 'بدء استعادة الأصناف دون تسوية مالية في هذه الخطوة.',
    icon: 'truck-outline',
  },
  returneddelivered: {
    label: 'تأكيد تسليم المرتجع',
    effect: 'تأكيد وصول المرتجع. التسوية تتم عند الإكمال.',
    icon: 'package-variant-closed',
  },
  completedreturned: {
    label: 'إكمال وتسوية المرتجع',
    effect: 'تُستعاد الكميات وتُسوّى الأرباح مرة واحدة. هذه الخطوة نهائية.',
    icon: 'check-circle-outline',
  },
};

type InternalActionCopy = (typeof internalActionCopy)[string];
// Same target, different money movement: a refused order reverses its delivery-fee deduction.
const fromRefused: Record<string, InternalActionCopy> = {
  delivered: {
    label: 'تسليم بعد الرفض',
    effect:
      'العميل استلم الطلب بعد رفضه. تُرد رسوم التوصيل المخصومة للتاجر، ثم تُحتسب أرباح التسليم.',
    icon: 'check-circle-outline',
  },
  cancelled: {
    label: 'إلغاء الطلب المرفوض',
    effect:
      'تُرد رسوم التوصيل المخصومة للتاجر. لا يعود المخزون الآن؛ تتم استعادته عند الإغلاق كراجع.',
    icon: 'close-circle-outline',
  },
};
export function internalActionFor(from: string, to: string): InternalActionCopy | undefined {
  const target = normalizeStatus(to);
  return (
    (normalizeStatus(from) === 'refusedondelivery' ? fromRefused[target] : undefined) ??
    internalActionCopy[target]
  );
}
export const reversesRefusal = (from: string, to: string) =>
  normalizeStatus(from) === 'refusedondelivery' &&
  ['delivered', 'cancelled'].includes(normalizeStatus(to));
export function internalRequiresNote(from: string, to: string) {
  return (
    normalizeStatus(to) === 'stuck' ||
    (normalizeStatus(from) === 'stuck' && normalizeStatus(to) === 'processing') ||
    reversesRefusal(from, to)
  );
}
