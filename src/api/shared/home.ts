import { baseApi } from '../base-api';
import { order } from '../normalizers';
import { dailyOrders, orderPage } from '@/domain/home-orders';
import type { Order } from '@/types/models';
export const homeApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    homeTotals: build.query<
      { total: number | null; processing: number | null; delivered: number | null },
      string
    >({
      async queryFn(_user, _api, _options, query) {
        const counts = await Promise.all(
          [undefined, 'Processing', 'Delivered'].map(async (Status) => {
            const result = await query({
              url: 'orders',
              params: { page: 1, pageSize: 1, ...(Status ? { Status } : {}) },
            });
            if (result.error) return null;
            try {
              const body = orderPage(result.data);
              if (Status && body.items.some((row) => row.status !== Status)) return null;
              return body.totalCount;
            } catch {
              return null;
            }
          }),
        );
        return { data: { total: counts[0], processing: counts[1], delivered: counts[2] } };
      },
      providesTags: ['Orders'],
    }),
    homeActivity: build.query<Order[], { userId: string; from: string; to: string; days: number }>({
      async queryFn({ from, to, days }, _api, _options, query) {
        const items: Order[] = [];
        const seen = new Set<string>();
        let expected: number | undefined;
        let pages = 1;
        try {
          for (let page = 1; page <= pages; page++) {
            const result = await query({
              url: 'orders',
              params: { FromDate: from, ToDate: to, page, pageSize: 100 },
            });
            if (result.error) return { error: result.error };
            const body = orderPage(result.data);
            if (page === 1) {
              expected = body.totalCount;
              pages = Math.max(1, body.totalPages);
            }
            if (pages > 50) throw new Error('عدد الطلبات كبير لهذه الفترة. اختر فترة أقصر.');
            if (
              body.totalCount !== expected ||
              Math.max(1, body.totalPages) !== pages ||
              (body.page != null && body.page !== page)
            )
              throw new Error('تغيّرت بيانات الطلبات أثناء التحميل. أعد المحاولة.');
            for (const raw of body.items) {
              const row = order(raw);
              const key = String(row.orderId);
              if (row.orderId == null || seen.has(key))
                throw new Error('تعذر التحقق من اكتمال بيانات الطلبات');
              seen.add(key);
              items.push(row);
            }
          }
          if (items.length !== expected) throw new Error('لم تكتمل بيانات الطلبات للفترة المختارة');
          dailyOrders(items, from, days);
          return { data: items };
        } catch (error) {
          return {
            error: {
              status: 'INCOMPLETE_DATA',
              message: error instanceof Error ? error.message : 'تعذر تحميل الإحصائيات',
            },
          };
        }
      },
      providesTags: ['Orders'],
    }),
  }),
});
export const { useHomeTotalsQuery, useHomeActivityQuery } = homeApi;
