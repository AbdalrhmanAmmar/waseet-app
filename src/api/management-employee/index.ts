import type { StatusInput } from '@/types/models';
import { baseApi } from '../base-api';
import { statusRequest } from '../shared/orders';
export const managementApi = baseApi.injectEndpoints({
  // Fast Refresh re-evaluates this module while retaining the base API instance.
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    managementOrderStatus: build.mutation<unknown, StatusInput>({
      query: statusRequest,
      invalidatesTags: ['Orders'],
    }),
  }),
});
export const { useManagementOrderStatusMutation } = managementApi;
export { useOrderFeedInfiniteQuery as useManagementOrdersQuery } from '../shared/orders';
