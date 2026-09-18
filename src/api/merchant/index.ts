import type { Id, Product } from '@/types/models';
import { baseApi } from '../base-api';
import { list, product } from '../normalizers';
export const merchantApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    merchantPrices: build.query<Product[], Id>({
      query: (id) => ({ url: `price-lists/${encodeURIComponent(id)}` }),
      transformResponse: (data) => list(data).map(product),
      providesTags: ['Products'],
    }),
  }),
});
export const { useMerchantPricesQuery } = merchantApi;
export {
  useCreateOrderMutation as useMerchantCreateOrderMutation,
  useOrderFeedInfiniteQuery as useMerchantOrdersQuery,
} from '../shared/orders';
