import type { DeliveryArea, Id, Page, Product } from '@/types/models';
import { baseApi } from '../base-api';
import { deliveryAreas, page, product, unwrap } from '../normalizers';
import { productForRole } from '@/domain/product-visibility';
type AuthState = { AuthSlice?: { userData?: { role?: unknown } | null } };
export type CatalogArgs = { userId: string; role: string };
export const catalogApi = baseApi.injectEndpoints({
  // Fast Refresh re-evaluates this module while retaining the base API instance.
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    productDetails: build.query<Product, { product_id: Id; user_id: Id }>({
      async queryFn({ product_id }, api, _options, baseQuery) {
        const result = await baseQuery({ url: `Product/${encodeURIComponent(product_id)}` });
        if (result.error) return { error: result.error };
        const raw = unwrap(result.data);
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
          return { error: { status: 404, message: 'المنتج غير موجود' } };
        if (String(raw.productCode ?? raw.id) !== String(product_id))
          return { error: { status: 'INVALID_RESPONSE', message: 'تعذر التحقق من بيانات المنتج' } };
        // Role read at response time, so a cached product never outlives a role switch.
        const role = (api.getState() as AuthState).AuthSlice?.userData?.role;
        return { data: productForRole(product(raw), role) };
      },
      providesTags: ['Products'],
    }),
    // The role is part of the cache key: each role gets only the prices it may see.
    catalog: build.infiniteQuery<Page<Product>, CatalogArgs, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: 'Product/all', params: { page: pageParam, pageSize: 20 } }),
      transformResponse: (data, _meta, args) =>
        page(data, { page: args.pageParam, pageSize: 20 }, (raw) =>
          productForRole(product(raw), args.queryArg.role),
        ),
      providesTags: ['Products'],
    }),
    deliveryAreas: build.query<DeliveryArea[], void>({
      async queryFn(_arg, _api, _options, baseQuery) {
        const result = await baseQuery({ url: 'delivery-areas' });
        if (result.error) return { error: result.error };
        try {
          return { data: deliveryAreas(result.data) };
        } catch {
          return { error: { status: 'INVALID_RESPONSE', message: 'تعذر قراءة مناطق التوصيل' } };
        }
      },
    }),
  }),
});
export const { useCatalogInfiniteQuery, useDeliveryAreasQuery, useProductDetailsQuery } =
  catalogApi;

// Safe before a hook subscription starts, and after Fast Refresh recreates it.
// The screen's query hook owns the subscription; this only requests fresh data.
export const refreshProductDetails = (args: { product_id: Id; user_id: Id }) =>
  catalogApi.endpoints.productDetails.initiate(args, { subscribe: false, forceRefetch: true });
