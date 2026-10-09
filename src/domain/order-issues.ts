import { z } from 'zod';
import { normalizeStatus, type DeliveryMode } from './order-workflow';
import type { Id, Order, OrderIssue } from '@/types/models';

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown) => (typeof value === 'string' ? value.trim() || null : null);
const identifier = (value: unknown): Id | null => {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  const valueText = text(value);
  return valueText && /^\d+$/.test(valueText) ? valueText : null;
};

export const orderIssueSchema = z.object({
  note: z
    .string()
    .trim()
    .min(5, 'اكتب وصفًا أوضح للمشكلة لا يقل عن 5 أحرف')
    .max(500, 'وصف المشكلة لا يمكن أن يتجاوز 500 حرف'),
});

export const orderIssueResolutionSchema = z.object({
  issueId: z
    .number()
    .int('رقم المشكلة غير صالح.')
    .positive('رقم المشكلة غير صالح.')
    .max(2147483647, 'رقم المشكلة غير صالح.'),
  resolutionNote: z
    .string()
    .trim()
    .min(5, 'اكتب ملاحظة الحل من 5 إلى 500 حرف.')
    .max(500, 'اكتب ملاحظة الحل من 5 إلى 500 حرف.'),
});

export function readOrderIssues(response: unknown): OrderIssue[] {
  if (record(response) && (response.isSuccess === false || response.success === false))
    throw new Error(text(response.message) || 'تعذر تحميل مشكلات الطلب.');
  const data = Array.isArray(response) ? response : record(response) ? response.data : undefined;
  if (data === null) return [];
  if (!Array.isArray(data)) throw new Error('تعذر قراءة مشكلات الطلب من استجابة الخادم.');
  const issues = data.map((value): OrderIssue => {
    if (!record(value) || typeof value.note !== 'string' || !value.note.trim())
      throw new Error('تعذر قراءة إحدى مشكلات الطلب من استجابة الخادم.');
    return {
      orderId: identifier(value.orderId ?? value.order_id),
      assignedToEmployeeId: identifier(
        value.assignedToEmployeeId ??
          value.assigned_to_employee_id ??
          value.assignedEmployeeId ??
          value.assigneeUserId,
      ),
      assignedToEmployeeName: text(value.assignedToEmployeeName ?? value.assigned_to_employee_name),
      canResolve: typeof value.canResolve === 'boolean' ? value.canResolve : null,
      orderIssueId: identifier(
        value.orderIssueId ?? value.order_issue_id ?? value.issueId ?? value.id,
      ),
      note: value.note.trim(),
      createdAt: text(value.createdAt ?? value.created_at ?? value.reportedAt),
      createdById: identifier(value.createdById ?? value.created_by_id ?? value.reportedById),
      createdByName: text(value.createdByName ?? value.created_by_name ?? value.reportedByName),
      createdByRole: text(value.createdByRole ?? value.created_by_role ?? value.reportedByRole),
      createdByActorType: text(
        value.createdByActorType ?? value.created_by_actor_type ?? value.reportedByActorType,
      ),
      status: text(value.status),
      resolutionNote: text(value.resolutionNote ?? value.resolution_note),
      resolvedAt: text(value.resolvedAt ?? value.resolved_at),
      resolvedByName: text(value.resolvedByName ?? value.resolved_by_name),
    };
  });
  const timestamp = (value: string | null) => {
    const parsed = value ? Date.parse(value) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : -Infinity;
  };
  return issues.sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
}

type IssueTone = 'open' | 'working' | 'resolved' | 'neutral';
const issueStatuses: Record<string, { label: string; tone: IssueTone }> = {
  new: { label: 'جديدة', tone: 'open' },
  reported: { label: 'تم الإبلاغ', tone: 'open' },
  open: { label: 'مفتوحة', tone: 'open' },
  pending: { label: 'قيد الانتظار', tone: 'open' },
  waiting: { label: 'قيد الانتظار', tone: 'open' },
  reopened: { label: 'أُعيد فتحها', tone: 'open' },
  assigned: { label: 'تم إسنادها', tone: 'working' },
  inprogress: { label: 'قيد المعالجة', tone: 'working' },
  workingonissue: { label: 'جارٍ العمل على المشكلة', tone: 'working' },
  underreview: { label: 'قيد المراجعة', tone: 'working' },
  onhold: { label: 'معلّقة', tone: 'working' },
  waitingforcustomer: { label: 'بانتظار العميل', tone: 'working' },
  waitingformerchant: { label: 'بانتظار التاجر', tone: 'working' },
  escalated: { label: 'تم التصعيد', tone: 'working' },
  resolved: { label: 'تم الحل', tone: 'resolved' },
  completed: { label: 'مكتملة', tone: 'resolved' },
  closed: { label: 'مغلقة', tone: 'resolved' },
  cancelled: { label: 'ملغاة', tone: 'neutral' },
  canceled: { label: 'ملغاة', tone: 'neutral' },
  rejected: { label: 'مرفوضة', tone: 'neutral' },
  failed: { label: 'فشل المعالجة', tone: 'neutral' },
};

export function issueStatusPresentation(status: string | null) {
  if (!status?.trim()) return { label: 'غير محددة', tone: 'neutral' as const };
  return (
    issueStatuses[normalizeStatus(status)] ?? {
      label: 'حالة غير معروفة',
      tone: 'neutral' as const,
    }
  );
}
export const issueIsResolved = (issue: OrderIssue) =>
  issueStatusPresentation(issue.status).tone === 'resolved' || !!issue.resolvedAt;
export const issueIsOpen = (issue: OrderIssue) =>
  ['open', 'working'].includes(issueStatusPresentation(issue.status).tone) &&
  !issueIsResolved(issue);

export function positiveIssueId(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= 2147483647 ? number : null;
}

export const canResolveOrderIssue = (issue: OrderIssue) =>
  positiveIssueId(issue.orderIssueId) !== null &&
  issue.canResolve !== false &&
  !issueIsResolved(issue) &&
  (issue.canResolve === true || issueIsOpen(issue));

export function issueActorLabel(issue: OrderIssue) {
  if (issue.createdByName) return issue.createdByName;
  const role = issue.createdByRole || issue.createdByActorType;
  const labels: Record<string, string> = {
    admin: 'الإدارة',
    superadmin: 'الإدارة',
    merchant: 'التاجر',
    merchantemployee: 'موظف التاجر',
    employee: 'الموظف',
    salesemployee: 'موظف المبيعات',
    managementemployee: 'موظف الإدارة',
    deliveryagent: 'مندوب التوصيل',
    system: 'النظام',
  };
  const label = role ? labels[normalizeStatus(role)] || role : 'المستخدم';
  return issue.createdById ? `${label} #${issue.createdById}` : role ? label : null;
}

export function orderIssueEligibility(order: Order, mode: DeliveryMode) {
  if (mode === 'unknown')
    return {
      allowed: false,
      reason: 'تعذر تحديد طريقة التوصيل. حدّث تفاصيل الطلب ثم حاول مرة أخرى.',
    };
  const status = (mode === 'external' ? order.oliveryStatus : order.deliveryStatus)?.trim();
  if (!status)
    return {
      allowed: false,
      reason: `${mode === 'external' ? 'حالة زحل' : 'حالة التوصيل'} غير متاحة. حدّث تفاصيل الطلب قبل تسجيل مشكلة.`,
    };
  if (normalizeStatus(status) !== 'delivered')
    return {
      allowed: false,
      reason: `يتاح تسجيل المشكلة عندما تصبح ${mode === 'external' ? 'حالة زحل' : 'حالة التوصيل'} «تم التسليم».`,
    };
  return { allowed: true, reason: null };
}
