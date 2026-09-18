import type { Id, Order, OrderInput, Page, PageParams, StatusInput } from '@/types/models';
import { baseApi } from '../base-api';
import { list, order, page, unwrap } from '../normalizers';
export const statusRequest = ({ orderId, status, notes }: StatusInput) => ({
  url: `orders/${encodeURIComponent(orderId)}/status`,
  method: 'POST',
  data: { targetStatus: status, ...(notes?.trim() ? { note: notes.trim() } : {}) },
});
export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    orderStatuses: build.query<{ status: string; isTerminal: boolean }[], void>({
      query: () => ({ url: 'orders/statuses' }),
      transformResponse: (data) =>
        list(data).map((item) => ({
          status: String(item.status),
          isTerminal: item.isTerminal === true,
        })),
    }),
    orderFeed: build.infiniteQuery<Page<Order>, string, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
      },
      query: ({ pageParam }) => ({ url: 'orders', params: { page: pageParam, pageSize: 20 } }),
      transformResponse: (data, _meta, args) =>
        page(data, { page: args.pageParam, pageSize: 20 }, order),
      providesTags: ['Orders'],
    }),
    orders: build.query<Page<Order>, PageParams>({
      query: (params) => ({ url: 'orders', params }),
      transformResponse: (data, _meta, args) => page(data, args, order),
      providesTags: ['Orders'],
    }),
    order: build.query<Order, Id>({
      query: (id) => ({ url: `orders/${encodeURIComponent(id)}` }),
      transformResponse: (data) => order(unwrap(data)),
      providesTags: ['Orders'],
    }),
    orderHistory: build.query<Record<string, any>[], Id>({
      query: (id) => ({ url: `orders/${encodeURIComponent(id)}/history` }),
      transformResponse: list,
      providesTags: ['Orders'],
    }),
    createOrder: build.mutation<{ orderId?: Id }, OrderInput>({
      query: (data) => ({ url: 'orders', method: 'POST', data }),
      transformResponse: (data) => unwrap(data),
      invalidatesTags: ['Orders', 'Products'],
    }),
  }),
});
export const {
  useOrderStatusesQuery,
  useOrderFeedInfiniteQuery,
  useOrdersQuery,
  useOrderQuery,
  useOrderHistoryQuery,
  useCreateOrderMutation,
} = ordersApi;
