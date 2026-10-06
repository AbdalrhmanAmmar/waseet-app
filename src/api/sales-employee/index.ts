import { baseApi } from '../base-api';
import { salesOrderOptions } from '@/domain/sales-order-options';
import type { Product } from '@/types/models';

export const salesApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    salesOrderOptions: build.query<Product[], string>({
      async queryFn(_userId, _api, _options, baseQuery) {
        const result = await baseQuery({ url: 'Product/order-options' });
        if (result.error) return { error: result.error };
        try {
          return { data: salesOrderOptions(result.data) };
        } catch {
          return {
            error: {
              status: 'INVALID_RESPONSE',
              message: 'تعذر قراءة خيارات المنتجات. حاول مجددًا.',
            },
          };
        }
      },
      providesTags: ['Products'],
    }),
  }),
});
export const { useSalesOrderOptionsQuery } = salesApi;
export {
  useCreateOrderMutation as useSalesCreateOrderMutation,
  useOrderFeedInfiniteQuery as useSalesOrdersQuery,
} from '../shared/orders';
