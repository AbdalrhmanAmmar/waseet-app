import { baseApi } from '../base-api';
import { unwrap } from '../normalizers';
import {
  WITHDRAWAL_NOTE_REQUIRED,
  withdrawalError,
  withdrawalRequestSchema,
} from '@/domain/withdrawal';
import { isAccountRestricted } from '@/auth/permissions';
import type { RootState } from '@/store';
import { merchantAccess } from '@/domain/merchant-access';
import {
  readMerchantWithdrawals,
  withdrawalFilterError,
  type WithdrawalFilters,
  type WithdrawalRecord,
} from '@/domain/merchant-finance';

export const withdrawalsApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    merchantWithdrawals: build.query<
      WithdrawalRecord[],
      { merchantId: string } & WithdrawalFilters
    >({
      async queryFn({ merchantId, ...filters }, api, _options, query) {
        if (!merchantAccess((api.getState() as RootState).AuthSlice.userData, merchantId))
          return { error: { status: 403, message: 'سجل السحوبات متاح للتاجر النشط فقط.' } };
        const invalid = withdrawalFilterError(filters);
        if (invalid) return { error: { status: 'INVALID_FILTER', message: invalid } };
        const result = await query({ url: 'withdrawal-requests/mine', params: filters });
        if (result.error) return { error: result.error };
        try {
          return { data: readMerchantWithdrawals(result.data, merchantId) };
        } catch (error) {
          return {
            error: {
              status: 'INVALID_RESPONSE',
              message: error instanceof Error ? error.message : 'تعذر قراءة سجل السحوبات.',
            },
          };
        }
      },
      providesTags: ['Withdrawals'],
    }),
    merchantWithdrawalRequest: build.mutation<null, { amount: number; note: string }>({
      invalidatesTags: ['Withdrawals', 'Profile'],
      async queryFn(body, api, _options, baseQuery) {
        const user = (api.getState() as RootState).AuthSlice.userData;
        const reject = (message: string) => ({
          error: { status: 'WITHDRAWAL_VALIDATION', message },
        });
        if (!user || user.role !== 'Merchant' || isAccountRestricted(user))
          return reject('طلب السحب متاح لحساب التاجر النشط فقط');
        const profile = await baseQuery({ url: `User/${encodeURIComponent(user.userId)}` });
        if (profile.error) return { error: profile.error };
        const latest = unwrap(profile.data);
        if (String(latest?.userId) !== String(user.userId) || isAccountRestricted(latest))
          return reject('تعذر تأكيد بيانات حسابك وصلاحيته لطلب السحب');
        const current = (api.getState() as RootState).AuthSlice.userData;
        if (!current || current.token !== user.token || current.userId !== user.userId)
          return reject('تغيرت جلسة الحساب. أعد تسجيل الدخول');
        const parsed = withdrawalRequestSchema.safeParse(body);
        if (!parsed.success)
          return reject(parsed.error.issues[0]?.message ?? 'بيانات طلب السحب غير صالحة');
        const error = withdrawalError(String(parsed.data.amount), latest?.dollarBalance);
        if (error) return reject(error);
        const result = await baseQuery({
          url: 'withdrawal-requests',
          method: 'POST',
          data: parsed.data,
        });
        if (result.error) {
          if (/note.*requi?red/i.test(result.error.message))
            return reject(WITHDRAWAL_NOTE_REQUIRED);
          const status = result.error.status;
          if (typeof status !== 'number' || status >= 500 || status === 408)
            return {
              error: {
                status: 'WITHDRAWAL_UNCERTAIN',
                message:
                  'لم نتمكن من التأكد من نتيجة الإرسال. تواصل مع الدعم للتحقق من الطلب قبل إرسال طلب آخر.',
              },
            };
          return { error: result.error };
        }
        return { data: null };
      },
    }),
  }),
});
export const { useMerchantWithdrawalRequestMutation, useMerchantWithdrawalsQuery } = withdrawalsApi;
