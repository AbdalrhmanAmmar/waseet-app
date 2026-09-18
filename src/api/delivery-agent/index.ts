import type { Order, Page, StatusInput } from '@/types/models';
import { baseApi } from '../base-api';
import { order, page } from '../normalizers';
import { statusRequest } from '../shared/orders';
export const deliveryApi = baseApi.injectEndpoints({
  // Fast Refresh re-evaluates this module while retaining the base API instance.
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    deliveries: build.infiniteQuery<Page<Order>, string, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({
        url: 'orders/my-deliveries',
        params: { page: pageParam, pageSize: 20 },
      }),
      transformResponse: (data, _meta, args) =>
        page(data, { page: args.pageParam, pageSize: 20 }, order),
      providesTags: ['Orders'],
    }),
    deliveryOrderStatus: build.mutation<unknown, StatusInput>({
      query: statusRequest,
      invalidatesTags: ['Orders'],
    }),
  }),
});
export const { useDeliveriesInfiniteQuery, useDeliveryOrderStatusMutation } = deliveryApi;
