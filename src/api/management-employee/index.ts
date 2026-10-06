import type { RootState } from '@/store';
import { actorFromUser } from '@/domain/internal-order-policy';
import type { StatusInput } from '@/types/models';
import { baseApi } from '../base-api';
import { guardedStatusChange } from '../shared/order-guards';
export const managementApi = baseApi.injectEndpoints({
  // Fast Refresh re-evaluates this module while retaining the base API instance.
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    managementOrderStatus: build.mutation<unknown, StatusInput>({
      queryFn: (args, _api, _options, baseQuery) =>
        guardedStatusChange(
          args,
          baseQuery,
          actorFromUser((_api.getState() as RootState).AuthSlice.userData),
        ),
      invalidatesTags: ['Orders', 'Products', 'Profile'],
    }),
  }),
});
export const { useManagementOrderStatusMutation } = managementApi;
export { useOrderFeedInfiniteQuery as useManagementOrdersQuery } from '../shared/orders';
