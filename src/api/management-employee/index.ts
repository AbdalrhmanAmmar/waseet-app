import type { StatusInput } from '@/types/models';
import { baseApi } from '../base-api';
import { statusRequest } from '../shared/orders';
export const managementApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    managementOrderStatus: build.mutation<unknown, StatusInput>({
      query: statusRequest,
      invalidatesTags: ['Orders'],
    }),
  }),
});
export const { useManagementOrderStatusMutation } = managementApi;
export { useOrderFeedInfiniteQuery as useManagementOrdersQuery } from '../shared/orders';
