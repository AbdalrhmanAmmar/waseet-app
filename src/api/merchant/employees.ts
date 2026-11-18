import { client } from '../client';
import type { EmployeeInput } from '@/domain/merchant-employee';
import { baseApi } from '../base-api';
import type { RootState } from '@/store';
import { merchantAccess } from '@/domain/merchant-access';
import { readMerchantEmployee, readMerchantEmployees } from '@/domain/employee-management';
import {
  guardedEmployeeAction,
  verifyEmployeeAction,
  type EmployeeActionInput,
} from './employee-guards';
// Credentials and response never enter the RTK Query cache or the login/session flow.
export async function createMerchantEmployee(input: EmployeeInput): Promise<void> {
  await client.post('user/merchant-employees', {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
  });
}
const invalid = (error: unknown) => ({
  error: {
    status: 'EMPLOYEE_VALIDATION',
    message: error instanceof Error ? error.message : 'تعذر قراءة بيانات الموظفين.',
  },
});
export const merchantEmployeesApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    merchantEmployees: build.query<ReturnType<typeof readMerchantEmployees>, string>({
      async queryFn(owner, api, _options, query) {
        if (!merchantAccess((api.getState() as RootState).AuthSlice.userData, owner))
          return invalid(new Error('إدارة الموظفين متاحة للتاجر النشط فقط.'));
        const result = await query({ url: 'User/employees' });
        if (result.error) return { error: result.error };
        try {
          return { data: readMerchantEmployees(result.data, owner) };
        } catch (error) {
          return invalid(error);
        }
      },
      providesTags: ['MerchantEmployees'],
    }),
    merchantEmployee: build.query<
      ReturnType<typeof readMerchantEmployee>,
      { merchantId: string; employeeId: string }
    >({
      async queryFn(args, api, _options, query) {
        if (!merchantAccess((api.getState() as RootState).AuthSlice.userData, args.merchantId))
          return invalid(new Error('إدارة الموظفين متاحة للتاجر النشط فقط.'));
        const list = await query({ url: 'User/employees' });
        if (list.error) return { error: list.error };
        try {
          if (
            !readMerchantEmployees(list.data, args.merchantId).some(
              (item) => item.id === args.employeeId,
            )
          )
            return { error: { status: 404, message: 'الموظف غير موجود في قائمة موظفيك.' } };
          const detail = await query({
            url: `User/employees/${encodeURIComponent(args.employeeId)}`,
          });
          if (detail.error) return { error: detail.error };
          return { data: readMerchantEmployee(detail.data, args.merchantId, args.employeeId) };
        } catch (error) {
          return invalid(error);
        }
      },
      providesTags: ['MerchantEmployees'],
    }),
    merchantEmployeeAction: build.mutation<unknown, EmployeeActionInput>({
      async queryFn(args, api, _options, query) {
        const actor = (api.getState() as RootState).AuthSlice.userData;
        const result = await guardedEmployeeAction(args, query, actor, () => {
          const current = (api.getState() as RootState).AuthSlice.userData;
          return (
            !!actor &&
            current?.userId === actor.userId &&
            current?.token === actor.token &&
            merchantAccess(current, args.merchantId)
          );
        });
        return result.error ? { error: result.error } : { data: result.data };
      },
      invalidatesTags: ['MerchantEmployees'],
    }),
    verifyMerchantEmployeeAction: build.mutation<
      unknown,
      Omit<EmployeeActionInput, 'expectedStatus'>
    >({
      async queryFn(args, api, _options, query) {
        const result = await verifyEmployeeAction(
          args,
          query,
          (api.getState() as RootState).AuthSlice.userData,
        );
        return result.error ? { error: result.error } : { data: result.data };
      },
      invalidatesTags: ['MerchantEmployees'],
    }),
  }),
});
export const {
  useMerchantEmployeesQuery,
  useMerchantEmployeeQuery,
  useMerchantEmployeeActionMutation,
  useVerifyMerchantEmployeeActionMutation,
} = merchantEmployeesApi;
