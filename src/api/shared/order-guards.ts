import { orderEditDecision } from '@/domain/order-edit-policy';
import { returnSettlementSnapshot } from '@/domain/internal-return';
import { externalTargets, externalActionReason } from '@/domain/external-order-policy';
import { resolveDeliveryMode } from '@/domain/order-delivery-list';
import {
  internalTargets,
  internalRequiresNote,
  type OrderActor,
} from '@/domain/internal-order-policy';
import type { AxiosRequestConfig } from 'axios';
import type { ApiError, StatusInput, OrderInput, Id } from '@/types/models';
import { deliveryAreas, orderDetails } from '../normalizers';
import {
  deliveryMode,
  normalizeStatus,
  orderVersion,
  validateOrderUpdate,
} from '@/domain/order-workflow';
export type Result = { data: unknown; error?: undefined } | { error: ApiError; data?: undefined };
export type Query = (args: AxiosRequestConfig) => Result | PromiseLike<Result>;
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
  return {
    current,
    areas,
    mode,
  };
}
export const pendingOrders = new Set<string>();
export const uncertainStatuses = new Set<string>();
export async function guardedStatusChange(
  input: StatusInput,
  query: Query,
  actor?: OrderActor | null,
): Promise<Result> {
  const key = String(input.orderId);
  if (pendingOrders.has(key)) return fail('يوجد إجراء قيد التنفيذ لهذا الطلب.');
  if (uncertainStatuses.has(key))
    return {
      error: {
        status: 'STATUS_UNCERTAIN',
        message: 'تحقق من نتيجة المحاولة السابقة عبر تحديث بيانات الطلب قبل إجراء جديد.',
      },
    };
  pendingOrders.add(key);
  let submitted = false;
  try {
    const { current, mode } = await freshOrderContext(input.orderId, query);
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
          : 'الإجراء غير متاح لدورك أو ملكية الطلب أو نوعه.'
        : externalTargets(current, actor, mode).some(
              (value) => normalizeStatus(value) === normalizeStatus(input.status),
            )
          ? externalActionReason(current, input.status)
          : 'الإجراء غير متاح لدورك أو حالة الطلب أو ملكيته.';
    if (reason) return fail(reason);
    if (
      mode === 'internal' &&
      normalizeStatus(input.status) === 'completedreturned' &&
      (!input.expectedReturnSettlement ||
        input.expectedReturnSettlement !== returnSettlementSnapshot(current))
    )
      return fail(
        'راجع الكميات والتسوية الحالية للمرتجع قبل الإكمال. تغير البيانات يستلزم مراجعة جديدة.',
      );
    if (internalRequiresNote(current.status, input.status) && !input.notes?.trim())
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
    uncertainStatuses.add(key);
    return {
      error: {
        status: 'STATUS_UNCERTAIN',
        message: 'تعذر تأكيد الحالة النهائية. حدّث تفاصيل الطلب قبل تنفيذ إجراء آخر.',
      },
    };
  } catch (error) {
    if (submitted) uncertainStatuses.add(key);
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
): Promise<Result> {
  if (actor?.role !== 'ManagementEmployee')
    return fail('تعديل بيانات الطلب متاح لموظف الإدارة فقط.');
  const key = String(args.orderId);
  if (pendingOrders.has(key) || uncertainStatuses.has(key))
    return fail('يوجد إجراء قيد التنفيذ أو التحقق لهذا الطلب.');
  pendingOrders.add(key);
  try {
    const { current, mode, areas } = await freshOrderContext(args.orderId, query);
    const invalid = validateOrderUpdate(args.input, mode);
    if (invalid) return fail(invalid);
    if (deliveryMode(args.input.customerArea, areas) !== mode)
      return fail('المنطقة الأصلية والجديدة يجب أن تكونا من نوع التوصيل نفسه.');
    const decision = orderEditDecision(current, actor ?? null, mode);
    if (!decision.allowed) return fail(decision.reason);
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
  } finally {
    pendingOrders.delete(key);
  }
}
export function normalizeGuardError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'status' in error && 'message' in error)
    return error as ApiError;
  return {
    status: 'INVALID_RESPONSE',
    message: error instanceof Error ? error.message : 'تعذر التحقق من الطلب',
  };
}
