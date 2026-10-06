import type { RootState } from '@/store';
import { actorFromUser } from '@/domain/internal-order-policy';
import { guardedStatusChange, guardedOrderUpdate, type UpdateOrderArgs } from './order-guards';
import type { Id, Order, OrderInput, Page, PageParams, StatusInput } from '@/types/models';
import { baseApi } from '../base-api';
import { order, orderDetails, orderStatuses, page, unwrap } from '../normalizers';
export const ordersApi = baseApi.injectEndpoints({
  // Fast Refresh re-evaluates this module while retaining the base API instance.
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    orderStatuses: build.query<{ status: string; isTerminal: boolean }[], void>({
      async queryFn(_args, _api, _options, query) {
        const result = await query({ url: 'orders/statuses' });
        if (result.error) return { error: result.error };
        try {
          return { data: orderStatuses(result.data) };
        } catch {
          return { error: { status: 'INVALID_RESPONSE', message: 'تعذر التحقق من حالات الطلب' } };
        }
      },
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
      async queryFn(id, _api, _options, query) {
        const result = await query({ url: `orders/${encodeURIComponent(id)}` });
        if (result.error) return { error: result.error };
        try {
          return { data: orderDetails(result.data, id) };
        } catch {
          return { error: { status: 'INVALID_RESPONSE', message: 'تعذر التحقق من تفاصيل الطلب' } };
        }
      },
      providesTags: ['Orders'],
    }),
    orderHistory: build.query<Record<string, any>[], Id>({
      async queryFn(id, _api, _options, query) {
        const result = await query({ url: `orders/${encodeURIComponent(id)}/history` });
        if (result.error) return { error: result.error };
        const body = unwrap(result.data);
        if (!Array.isArray(body) || body.some((event) => !event || typeof event !== 'object'))
          return { error: { status: 'INVALID_RESPONSE', message: 'تعذر قراءة سجل العمليات' } };
        return { data: body };
      },
      providesTags: ['Orders'],
    }),
    changeOrderStatus: build.mutation<unknown, StatusInput>({
      queryFn: (args, _api, _options, baseQuery) =>
        guardedStatusChange(
          args,
          baseQuery,
          actorFromUser((_api.getState() as RootState).AuthSlice.userData),
        ),
      invalidatesTags: ['Orders', 'Products', 'Profile'],
    }),
    updateOrder: build.mutation<unknown, UpdateOrderArgs>({
      queryFn: (args, _api, _options, baseQuery) =>
        guardedOrderUpdate(
          args,
          baseQuery,
          actorFromUser((_api.getState() as RootState).AuthSlice.userData),
        ),
      invalidatesTags: ['Orders', 'Products'],
    }),
    createOrder: build.mutation<{ orderId?: Id }, OrderInput>({
      query: ({ secondCustomerPhone, ...data }) => ({
        url: 'orders',
        method: 'POST',
        data: {
          ...data,
          ...(secondCustomerPhone?.trim()
            ? { second_customer_phone: secondCustomerPhone.trim() }
            : {}),
        },
      }),
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
  useChangeOrderStatusMutation,
  useUpdateOrderMutation,
} = ordersApi;
