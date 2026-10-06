import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/config/env';
import { baseApi } from '../base-api';
import { unwrap } from '../normalizers';
import type { RootState } from '@/store';
import type { Id } from '@/types/models';
import { actorFromUser, type OrderActor } from '@/domain/internal-order-policy';
import {
  internalReturnDecision,
  validateReturnDraft,
  returnSourceSnapshot,
  createdInternalReturnId,
  type ReturnDraft,
} from '@/domain/internal-return';
import {
  freshOrderContext,
  normalizeGuardError,
  pendingOrders,
  uncertainStatuses,
  type Query,
} from './order-guards';
export type ReturnReceipt = { state: 'saved' | 'uncertain'; orderId?: number };
const receipts = new Map<string, ReturnReceipt>();
const keyFor = (id: Id, actor: OrderActor | null) =>
  `internal-return:${API_URL}:${actor?.role}:${actor?.userId}:${id}`;
async function loadReceipt(key: string) {
  if (receipts.has(key)) return receipts.get(key)!;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as ReturnReceipt;
  if (parsed.state !== 'saved' && parsed.state !== 'uncertain')
    throw new Error('تعذر قراءة نتيجة المحاولة السابقة.');
  receipts.set(key, parsed);
  return parsed;
}
async function saveReceipt(key: string, receipt: ReturnReceipt) {
  receipts.set(key, receipt);
  await AsyncStorage.setItem(key, JSON.stringify(receipt));
}
export type CreateInternalReturnArgs = {
  orderId: Id;
  draft: ReturnDraft;
  expectedSnapshot: string;
};
export async function createInternalReturn(
  args: CreateInternalReturnArgs,
  query: Query,
  actor: OrderActor | null,
) {
  const key = String(args.orderId),
    receiptKey = keyFor(args.orderId, actor);
  const fail = (message: string) => ({ error: { status: 'RETURN_VALIDATION', message } });
  if (pendingOrders.has(key) || uncertainStatuses.has(key))
    return fail('يوجد إجراء قيد التنفيذ أو التحقق لهذا الطلب.');
  pendingOrders.add(key);
  let submitted = false;
  try {
    const previous = await loadReceipt(receiptKey);
    if (previous?.state === 'saved') return { data: previous };
    if (previous)
      return fail('نتيجة المحاولة السابقة غير مؤكدة. تحقق من الطلب قبل المحاولة مجددًا.');
    const { current, mode } = await freshOrderContext(args.orderId, query);
    const decision = internalReturnDecision(current, mode, actor);
    if (!decision.allowed) return fail(decision.reason);
    if (returnSourceSnapshot(current) !== args.expectedSnapshot)
      return fail('تغيرت بيانات الطلب. ارجع للتفاصيل وأعد فتح إنشاء المرتجع.');
    const validation = validateReturnDraft(current, args.draft);
    if (!validation.valid) return fail(Object.values(validation.errors).join('\n'));
    await saveReceipt(receiptKey, { state: 'uncertain' });
    submitted = true;
    const response = await query({
      url: `orders/${encodeURIComponent(args.orderId)}/internal-returns`,
      method: 'POST',
      data: validation.body,
    });
    if (response.error) {
      if (
        typeof response.error.status === 'number' &&
        [200, 400, 401, 403, 404, 422].includes(response.error.status)
      ) {
        await AsyncStorage.removeItem(receiptKey);
        receipts.delete(receiptKey);
        return response;
      }
      receipts.set(receiptKey, { state: 'uncertain' });
      return fail('تعذر تأكيد نتيجة الإنشاء. تحقق من المحاولة السابقة قبل أي إعادة إرسال.');
    }
    const receipt: ReturnReceipt = { state: 'saved' };
    receipts.set(receiptKey, receipt);
    await saveReceipt(receiptKey, receipt).catch(() => {});
    const id = createdInternalReturnId(unwrap(response.data), args.orderId);
    if (id) {
      // Navigation is allowed only after independently checking the returned relationship.
      try {
        const detail = await query({ url: `orders/${id}` });
        if (!detail.error && createdInternalReturnId(unwrap(detail.data), args.orderId) === id)
          receipt.orderId = id;
      } catch {
        /* A successful creation remains successful even if reading fails. */
      }
    }
    await saveReceipt(receiptKey, receipt).catch(() => {});
    return { data: receipt };
  } catch (error) {
    if (submitted) receipts.set(receiptKey, { state: 'uncertain' });
    return {
      error: submitted
        ? {
            status: 'RETURN_UNCERTAIN',
            message: 'تعذر تأكيد الإنشاء. تحقق من نتيجة المحاولة السابقة.',
          }
        : normalizeGuardError(error),
    };
  } finally {
    pendingOrders.delete(key);
  }
}
export const internalReturnsApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    internalReturnReceipt: build.query<
      ReturnReceipt | null,
      { orderId: Id; userId: Id; role: string }
    >({
      async queryFn({ orderId, userId, role }) {
        try {
          return { data: await loadReceipt(keyFor(orderId, { userId, role })) };
        } catch (error) {
          return { error: normalizeGuardError(error) };
        }
      },
      providesTags: ['Orders'],
    }),
    createInternalReturn: build.mutation<ReturnReceipt, CreateInternalReturnArgs>({
      queryFn: (args, api, _options, query) =>
        createInternalReturn(
          args,
          query,
          actorFromUser((api.getState() as RootState).AuthSlice.userData),
        ),
      invalidatesTags: ['Orders'],
    }),
    verifyInternalReturn: build.mutation<ReturnReceipt | null, Id>({
      async queryFn(id, api, _options, query) {
        const key = String(id);
        if (pendingOrders.has(key))
          return { error: { status: 'BUSY', message: 'يوجد إجراء قيد التنفيذ.' } };
        pendingOrders.add(key);
        try {
          const actor = actorFromUser((api.getState() as RootState).AuthSlice.userData);
          const receiptKey = keyFor(id, actor);
          await loadReceipt(receiptKey);
          const { current } = await freshOrderContext(id, query);
          if (
            current.isReturnProcessed === true ||
            current.items.some((i) => Number(i.returnedQuantity) > 0)
          )
            await saveReceipt(receiptKey, { state: 'saved' });
          else if (
            current.isReturnProcessed === false &&
            receipts.get(receiptKey)?.state === 'uncertain'
          ) {
            await AsyncStorage.removeItem(receiptKey);
            receipts.delete(receiptKey);
          }
          // An omitted flag permits initial creation, but cannot prove a timed-out write failed.
          return { data: receipts.get(receiptKey) ?? null };
        } catch (error) {
          return { error: normalizeGuardError(error) };
        } finally {
          pendingOrders.delete(key);
        }
      },
      invalidatesTags: ['Orders'],
    }),
  }),
});
export const {
  useCreateInternalReturnMutation,
  useInternalReturnReceiptQuery,
  useVerifyInternalReturnMutation,
} = internalReturnsApi;
