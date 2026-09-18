import type { DeliveryArea, Id, Page, PageParams, Product } from '@/types/models';
import { baseApi } from '../base-api';
import { list, page, product, unwrap } from '../normalizers';
export const catalogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    productDetails: build.query<Product, { product_id: Id; user_id: Id }>({
      query: ({ product_id }) => ({ url: `Product/${encodeURIComponent(product_id)}` }),
      transformResponse: (data) => product(unwrap(data)),
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
