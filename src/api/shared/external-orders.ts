import { baseApi } from '../base-api';
import type { RootState } from '@/store';
import type { Id, Order } from '@/types/models';
import { actorFromUser, type OrderActor } from '@/domain/internal-order-policy';
import {
  hasShipment,
  externalReturnReason,
  externalReturnSnapshot,
  validateExternalReturn,
  returnProcessed,
  type ExternalReturnInput,
} from '@/domain/external-order-policy';
import { orderDetails } from '../normalizers';
import {
  freshOrderContext,
  normalizeGuardError,
  pendingOrders,
  uncertainStatuses,
  type Query,
} from './order-guards';
type Receipt = { state: 'saved' | 'uncertain'; items: ExternalReturnInput['items'] };
const receipts = new Map<string, Receipt>();
const receiptKey = (id: Id, actor: OrderActor | null) =>
  `${actor?.role}:${String(actor?.userId)}:${id}`;
async function read(id: Id, query: Query) {
  const result = await query({ url: `orders/${encodeURIComponent(id)}` });
  if (result.error) throw result.error;
  return orderDetails(result.data, id);
}
export async function refreshExternalOrder(id: Id, query: Query, sync = true) {
  const context = await freshOrderContext(id, query);
  if (sync && context.mode === 'external' && hasShipment(context.current)) {
    const result = await query({ url: `orders/${encodeURIComponent(id)}/delivery-status` });
    if (result.error) throw result.error;
    return read(id, query);
  }
  return context.current;
}
export const externalOrdersApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    externalReturnReceipt: build.query<Receipt | null, { orderId: Id; userId: Id; role: string }>({
      queryFn: ({ orderId, userId, role }) => ({
        data: receipts.get(receiptKey(orderId, { userId, role })) ?? null,
      }),
      providesTags: ['Orders'],
    }),
    refreshExternalOrder: build.mutation<Order, { orderId: Id; sync?: boolean }>({
      async queryFn({ orderId, sync }, api, _options, query) {
        const key = String(orderId);
        if (pendingOrders.has(key))
          return { error: { status: 'BUSY', message: 'يوجد إجراء قيد التنفيذ.' } };
        pendingOrders.add(key);
        try {
          const current = await refreshExternalOrder(orderId, query, sync);
          uncertainStatuses.delete(key);
          const actor = actorFromUser((api.getState() as RootState).AuthSlice.userData),
            receipt = receiptKey(orderId, actor),
            previous = receipts.get(receipt);
          if (previous?.state === 'uncertain') {
            if (returnProcessed(current)) receipts.set(receipt, { ...previous, state: 'saved' });
            else if (current.isReturnProcessed === false) receipts.delete(receipt);
          }
          return { data: current };
        } catch (error) {
          return { error: normalizeGuardError(error) };
        } finally {
          pendingOrders.delete(key);
        }
      },
      invalidatesTags: ['Orders', 'Products', 'Profile'],
    }),
    processExternalReturn: build.mutation<
      Receipt,
      { orderId: Id; input: ExternalReturnInput; expectedSnapshot: string }
    >({
      async queryFn({ orderId, input, expectedSnapshot }, api, _options, query) {
        const actor = actorFromUser((api.getState() as RootState).AuthSlice.userData),
          key = String(orderId),
          receipt = receiptKey(orderId, actor);
        if (pendingOrders.has(key) || uncertainStatuses.has(key) || receipts.has(receipt))
          return {
            error: {
              status: 'BUSY',
              message: 'تحقق من نتيجة العملية السابقة قبل متابعة المعالجة.',
            },
          };
        pendingOrders.add(key);
        let submitted = false;
        try {
          const first = await freshOrderContext(orderId, query);
          const denied = externalReturnReason(first.current, actor, first.mode);
          if (denied) throw { status: 'VALIDATION_ERROR', message: denied };
          const sync = await query({
            url: `orders/${encodeURIComponent(orderId)}/delivery-status`,
          });
          if (sync.error) throw sync.error;
          const fresh = await freshOrderContext(orderId, query);
          const invalid =
            externalReturnReason(fresh.current, actor, fresh.mode) ||
            validateExternalReturn(fresh.current, input);
          if (invalid) throw { status: 'VALIDATION_ERROR', message: invalid };
          if (externalReturnSnapshot(fresh.current) !== expectedSnapshot)
            throw {
              status: 'VALIDATION_ERROR',
              message: 'تغيرت بنود الطلب. حدّث التفاصيل وراجع الكميات قبل المعالجة.',
            };
          submitted = true;
          const result = await query({
            url: `orders/${encodeURIComponent(orderId)}/olivery-returns`,
            method: 'POST',
            data: input,
          });
          if (result.error) {
            const certain =
              typeof result.error.status === 'number' &&
              [200, 400, 401, 403, 404, 422].includes(result.error.status);
            if (!certain) receipts.set(receipt, { state: 'uncertain', items: input.items });
            try {
              const actual = await read(orderId, query);
              if (returnProcessed(actual)) {
                const saved: Receipt = { state: 'saved', items: input.items };
                receipts.set(receipt, saved);
                return { data: saved };
              }
            } catch {
              /* Retain uncertainty and user selection. */
            }
            throw result.error;
          }
          const saved: Receipt = { state: 'saved', items: input.items };
          receipts.set(receipt, saved);
          try {
            await read(orderId, query);
          } catch {
            /* A confirmed write must not become a retryable failure. */
          }
          return { data: saved };
        } catch (error) {
          if (
            submitted &&
            !receipts.has(receipt) &&
            !(
              typeof (error as { status?: unknown })?.status === 'number' &&
              [200, 400, 401, 403, 404, 422].includes(Number((error as { status: unknown }).status))
            )
          )
            receipts.set(receipt, { state: 'uncertain', items: input.items });
          return { error: normalizeGuardError(error) };
        } finally {
          pendingOrders.delete(key);
        }
      },
      invalidatesTags: ['Orders', 'Products', 'Profile'],
    }),
  }),
});
export const {
  useExternalReturnReceiptQuery,
  useRefreshExternalOrderMutation,
  useProcessExternalReturnMutation,
} = externalOrdersApi;
