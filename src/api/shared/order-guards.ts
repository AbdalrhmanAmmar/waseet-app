import type { AxiosRequestConfig } from 'axios';
import type { ApiError, StatusInput, OrderInput, Id } from '@/types/models';
import { deliveryAreas, orderDetails, orderStatuses } from '../normalizers';
import {
  deliveryMode,
  normalizeStatus,
  orderVersion,
  requiresStatusNote,
  terminalStatus,
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
  if (areaResult.error) throw areaResult.error;
  const statusResult = await query({ url: 'orders/statuses' });
  if (statusResult.error) throw statusResult.error;
  const definitions = orderStatuses(statusResult.data);
  if (!definitions.some((d) => normalizeStatus(d.status) === normalizeStatus(current.status)))
    throw { status: 'INVALID_RESPONSE', message: 'تعذر التحقق من حالة الطلب الحالية' };
  const areas = deliveryAreas(areaResult.data);
  return {
    current,
    areas,
    definitions: definitions as StatusDefinition[],
    mode: deliveryMode(current.customerArea, areas),
  };
}
export async function guardedStatusChange(input: StatusInput, query: Query) {
  try {
    const { current, mode, definitions } = await freshOrderContext(input.orderId, query);
    if (
      input.expectedStatus &&
      normalizeStatus(input.expectedStatus) !== normalizeStatus(current.status)
    )
      return fail('تغيرت حالة الطلب. أغلق النافذة وأعد فتحها لمراجعة الحالة الجديدة.');
    const reason = transitionReason(mode, current.status, input.status, definitions);
    if (reason) return fail(reason);
    if (requiresStatusNote(current.status, input.status) && !input.notes?.trim())
      return fail('اكتب ملاحظة التعثر أو الحل قبل الحفظ.');
    if ((input.notes?.trim().length ?? 0) > 500) return fail('الملاحظة لا تتجاوز 500 حرف.');
    return await query({
      url: `orders/${encodeURIComponent(input.orderId)}/status`,
      method: 'POST',
      data: {
        targetStatus: input.status,
        ...(input.notes?.trim() ? { note: input.notes.trim() } : {}),
      },
    });
  } catch (error) {
    return { error: normalizeGuardError(error) };
  }
}
export type UpdateOrderArgs = { orderId: Id; input: OrderInput; expectedVersion: string };
export async function guardedOrderUpdate(args: UpdateOrderArgs, query: Query) {
  try {
    const invalid = validateOrderUpdate(args.input);
    if (invalid) return fail(invalid);
    const { current, mode, areas, definitions } = await freshOrderContext(args.orderId, query);
    if (mode !== 'internal' || deliveryMode(args.input.customerArea, areas) !== 'internal')
      return fail('تعديل الطلب يتطلب أن تكون المنطقة الأصلية والجديدة بتوصيل داخلي مؤكد.');
    if (terminalStatus(current.status, definitions)) return fail('هذا الطلب في حالة نهائية');
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
