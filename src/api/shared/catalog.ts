import type { DeliveryArea, Id, Page, PageParams, Product } from '@/types/models';
import { baseApi } from '../base-api';
import { list, page, product, unwrap } from '../normalizers';
export const catalogApi = baseApi.injectEndpoints({
  // Fast Refresh re-evaluates this module while retaining the base API instance.
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    productDetails: build.query<Product, { product_id: Id; user_id: Id }>({
      async queryFn({ product_id }, _api, _options, baseQuery) {
        const result = await baseQuery({ url: `Product/${encodeURIComponent(product_id)}` });
        if (result.error) return { error: result.error };
        const raw = unwrap(result.data);
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
          return { error: { status: 404, message: 'المنتج غير موجود' } };
        if (String(raw.productCode ?? raw.id) !== String(product_id))
          return { error: { status: 'INVALID_RESPONSE', message: 'تعذر التحقق من بيانات المنتج' } };
        return { data: product(raw) };
      },
      providesTags: ['Products'],
    }),
    catalog: build.infiniteQuery<Page<Product>, string, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: 'Product/all', params: { page: pageParam, pageSize: 20 } }),
      transformResponse: (data, _meta, args) =>
        page(data, { page: args.pageParam, pageSize: 20 }, product),
      providesTags: ['Products'],
    }),
    products: build.query<Page<Product>, PageParams>({
      query: (params) => ({ url: 'Product/all', params }),
      transformResponse: (data, _meta, args) => page(data, args, product),
      providesTags: ['Products'],
    }),
    deliveryAreas: build.query<DeliveryArea[], void>({
      query: () => ({ url: 'delivery-areas' }),
      transformResponse: (data) =>
        list(data).map((item) => ({
          deliveryAreaId: item.deliveryAreaId ?? item.id ?? item.city,
          city: item.city ?? item.name ?? item.areaName,
          fee: item.fee == null ? null : Number(item.fee),
        })),
    }),
  }),
});
export const {
  useCatalogInfiniteQuery,
  useProductsQuery,
  useDeliveryAreasQuery,
  useProductDetailsQuery,
} = catalogApi;

// Safe before a hook subscription starts, and after Fast Refresh recreates it.
// The screen's query hook owns the subscription; this only requests fresh data.
export const refreshProductDetails = (args: { product_id: Id; user_id: Id }) =>
  catalogApi.endpoints.productDetails.initiate(args, { subscribe: false, forceRefetch: true });
