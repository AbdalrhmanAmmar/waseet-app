import { baseApi } from '../base-api';
import { unwrap } from '../normalizers';
import { withdrawalError } from '@/domain/withdrawal';
import { isAccountRestricted } from '@/auth/permissions';
import type { RootState } from '@/store';

export const withdrawalsApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    merchantWithdrawalRequest: build.mutation<null, { amount: number; note: string }>({
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
        const error = withdrawalError(String(body.amount), latest?.dollarBalance);
        if (error) return reject(error);
        const result = await baseQuery({ url: 'withdrawl-requests', method: 'POST', data: body });
        if (result.error) {
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
export const { useMerchantWithdrawalRequestMutation } = withdrawalsApi;
