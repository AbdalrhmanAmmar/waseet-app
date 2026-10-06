import { resolveDeliveryMode } from '@/domain/order-delivery-list';
import {
  internalTargets,
  canEditInternal,
  internalRequiresNote,
  type OrderActor,
} from '@/domain/internal-order-policy';
import type { AxiosRequestConfig } from 'axios';
import type { ApiError, StatusInput, OrderInput, Id } from '@/types/models';
import { deliveryAreas, orderDetails, orderStatuses } from '../normalizers';
import {
  deliveryMode,
  normalizeStatus,
  orderVersion,
  requiresStatusNote,
  transitionReason,
  validateOrderUpdate,
  type StatusDefinition,
} from '@/domain/order-workflow';
type Result = { data: unknown; error?: undefined } | { error: ApiError; data?: undefined };
type Query = (args: AxiosRequestConfig) => Result | PromiseLike<Result>;
const fail = (message: string) => ({ error: { status: 'VALIDATION_ERROR', message } as ApiError });
export async function freshOrderContext(id: Id, query: Query) {
  const detail = await query({ url: `orders/${encodeURIComponent(id)}` });
  if (detail.error) throw detail.error;
  const current = orderDetails(detail.data, id);
  const areaResult = await query({ url: 'delivery-areas' });
  const areas = areaResult.error ? [] : deliveryAreas(areaResult.data);
  const mode = resolveDeliveryMode(current, areas);
  if (mode === 'unknown')
    throw areaResult.error ?? { status: 'INVALID_RESPONSE', message: 'تعذر تحديد جهة توصيل الطلب' };
  let definitions: StatusDefinition[] = [];
  if (mode === 'external') {
    const statusResult = await query({ url: 'orders/statuses' });
    if (statusResult.error) throw statusResult.error;
    definitions = orderStatuses(statusResult.data);
  }
  if (
    mode !== 'internal' &&
    !definitions.some((d) => normalizeStatus(d.status) === normalizeStatus(current.status))
  )
    throw { status: 'INVALID_RESPONSE', message: 'تعذر التحقق من حالة الطلب الحالية' };
  return {
    current,
    areas,
    definitions: definitions as StatusDefinition[],
    mode,
  };
}
const pendingOrders = new Set<string>();
export async function guardedStatusChange(
  input: StatusInput,
  query: Query,
  actor?: OrderActor | null,
) {
  const key = String(input.orderId);
  if (pendingOrders.has(key)) return fail('يوجد إجراء قيد التنفيذ لهذا الطلب.');
  pendingOrders.add(key);
  let submitted = false;
  try {
    const { current, mode, definitions } = await freshOrderContext(input.orderId, query);
    if (
      input.expectedStatus &&
      normalizeStatus(input.expectedStatus) !== normalizeStatus(current.status)
    )
      return fail('تغيرت حالة الطلب. أغلق النافذة وأعد فتحها لمراجعة الحالة الجديدة.');
    const reason =
      mode === 'internal'
        ? internalTargets(current, actor, mode).some(
            (value) => normalizeStatus(value) === normalizeStatus(input.status),
          )
          ? null
          : 'الإجراء غير متاح لدورك أو إسناد الطلب أو ملكيته أو نوعه.'
        : transitionReason(mode, current.status, input.status, definitions);
    if (reason) return fail(reason);
    if (
      (mode === 'internal'
        ? internalRequiresNote(current.status, input.status)
        : requiresStatusNote(current.status, input.status)) &&
      !input.notes?.trim()
    )
      return fail('اكتب ملاحظة التعثر أو الحل قبل الحفظ.');
    if ((input.notes?.trim().length ?? 0) > 500) return fail('الملاحظة لا تتجاوز 500 حرف.');
    submitted = true;
    const result = await query({
      url: `orders/${encodeURIComponent(input.orderId)}/status`,
      method: 'POST',
      data: {
        targetStatus: input.status,
        ...(input.notes?.trim() ? { note: input.notes.trim() } : {}),
      },
    });
    if (mode !== 'internal') return result;
    const confirmed = await query({ url: `orders/${encodeURIComponent(input.orderId)}` });
    if (!confirmed.error) {
      const refreshed = orderDetails(confirmed.data, input.orderId);
      if (normalizeStatus(refreshed.status) === normalizeStatus(input.status))
        return { data: refreshed };
    }
    if (
      result.error &&
      typeof result.error.status === 'number' &&
      result.error.status < 500 &&
      result.error.status !== 408
    )
      return result;
    return {
      error: {
        status: 'STATUS_UNCERTAIN',
        message: 'تعذر تأكيد الحالة النهائية. حدّث تفاصيل الطلب قبل تنفيذ إجراء آخر.',
      },
    };
  } catch (error) {
    return {
      error: submitted
        ? {
            status: 'STATUS_UNCERTAIN',
            message: 'تعذر تأكيد نتيجة الإجراء. حدّث الطلب للتحقق من حالته قبل إعادة المحاولة.',
          }
        : normalizeGuardError(error),
    };
  } finally {
    pendingOrders.delete(key);
  }
}
export type UpdateOrderArgs = { orderId: Id; input: OrderInput; expectedVersion: string };
export async function guardedOrderUpdate(
  args: UpdateOrderArgs,
  query: Query,
  actor?: OrderActor | null,
) {
  try {
    const invalid = validateOrderUpdate(args.input, 'internal');
    if (invalid) return fail(invalid);
    const { current, mode, areas } = await freshOrderContext(args.orderId, query);
    if (mode !== 'internal' || deliveryMode(args.input.customerArea, areas) !== 'internal')
      return fail('تعديل الطلب يتطلب أن تكون المنطقة الأصلية والجديدة بتوصيل داخلي مؤكد.');
    if (!canEditInternal(current, actor, mode))
      return fail('تعديل الطلب الداخلي متاح لموظف الإدارة المسند إليه الطلب فقط.');
    if (orderVersion(current) !== args.expectedVersion)
      return fail(
        'تغيرت بيانات الطلب منذ فتح التعديل. ارجع للتفاصيل وأعد فتح التعديل لمراجعة التغييرات.',
      );
    return await query({
      url: `orders/${encodeURIComponent(args.orderId)}`,
      method: 'PUT',
      data: args.input,
    });
  } catch (error) {
    return { error: normalizeGuardError(error) };
  }
}
function normalizeGuardError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'status' in error && 'message' in error)
    return error as ApiError;
  return {
    status: 'INVALID_RESPONSE',
    message: error instanceof Error ? error.message : 'تعذر التحقق من الطلب',
  };
}
