import type { AxiosRequestConfig } from 'axios';
import type { ApiError, User } from '@/types/models';
import { merchantAccess } from '@/domain/merchant-access';
import {
  employeeActionAllowed,
  employeeStatusKey,
  readMerchantEmployee,
  readMerchantEmployees,
  type EmployeeAction,
} from '@/domain/employee-management';
export type EmployeeActionInput = {
  merchantId: string;
  employeeId: string;
  action: EmployeeAction;
  expectedStatus: string;
};
export type EmployeeActionError = ApiError & { targetAction?: EmployeeAction };
type Result = { data?: unknown; error?: ApiError };
type Query = (args: AxiosRequestConfig) => PromiseLike<Result> | Result;
const pending = new Set<string>();
const uncertain = (action: EmployeeAction) => ({
  error: {
    status: 'EMPLOYEE_UNCERTAIN',
    targetAction: action,
    message: 'تعذر تأكيد نتيجة الإجراء. تحقّق من النتيجة قبل تنفيذ إجراء آخر.',
  } satisfies EmployeeActionError,
});
const fail = (message: string, status: ApiError['status'] = 'EMPLOYEE_VALIDATION') => ({
  error: { status, message },
});
export async function verifyEmployeeAction(
  input: Omit<EmployeeActionInput, 'expectedStatus'>,
  query: Query,
  actor: User | null,
): Promise<Result> {
  if (!merchantAccess(actor, input.merchantId))
    return fail('إدارة الموظفين متاحة للتاجر النشط فقط.');
  try {
    const list = await query({ url: 'User/employees' });
    if (list.error) return uncertain(input.action);
    const member = readMerchantEmployees(list.data, input.merchantId).find(
      (item) => item.id === input.employeeId,
    );
    if (input.action === 'delete')
      return !member ? { data: { deleted: true } } : uncertain(input.action);
    if (!member) return uncertain(input.action);
    const detail = await query({ url: `User/employees/${encodeURIComponent(input.employeeId)}` });
    if (detail.error) return uncertain(input.action);
    const employee = readMerchantEmployee(detail.data, input.merchantId, input.employeeId);
    return employeeStatusKey(employee.status) === employeeStatusKey(input.action)
      ? { data: employee }
      : uncertain(input.action);
  } catch {
    return uncertain(input.action);
  }
}
export async function guardedEmployeeAction(
  input: EmployeeActionInput,
  query: Query,
  actor: User | null,
  stillCurrent: () => boolean = () => true,
): Promise<Result> {
  if (!merchantAccess(actor, input.merchantId))
    return fail('إدارة الموظفين متاحة للتاجر النشط فقط.');
  if (!['Approved', 'Rejected', 'delete'].includes(input.action)) return fail('الإجراء غير صالح.');
  const key = `${input.merchantId}:${input.employeeId}`;
  if (pending.has(key)) return fail('يوجد إجراء قيد التنفيذ لهذا الموظف.');
  pending.add(key);
  let submitted = false;
  try {
    const list = await query({ url: 'User/employees' });
    if (list.error) return list;
    const member = readMerchantEmployees(list.data, input.merchantId).find(
      (item) => item.id === input.employeeId,
    );
    if (!member) return fail('هذا الموظف غير موجود في قائمة موظفيك. حدّث القائمة.');
    const detail = await query({ url: `User/employees/${encodeURIComponent(input.employeeId)}` });
    if (detail.error) return detail;
    const employee = readMerchantEmployee(detail.data, input.merchantId, input.employeeId);
    if (employeeStatusKey(employee.status) !== employeeStatusKey(input.expectedStatus))
      return fail('تغيرت حالة الموظف. حدّث بياناته وراجع الإجراء مجددًا.', 409);
    if (!employeeActionAllowed(employee, input.action))
      return fail('هذا الإجراء غير متاح من الحالة الحالية.');
    if (!stillCurrent()) return fail('تغيرت جلسة الحساب. أعد تسجيل الدخول.');
    submitted = true;
    const result = await query(
      input.action === 'delete'
        ? { url: `User/employees/${encodeURIComponent(input.employeeId)}`, method: 'DELETE' }
        : {
            url: `User/employees/${encodeURIComponent(input.employeeId)}/status`,
            method: 'PUT',
            params: { status: input.action },
          },
    );
    if (
      result.error &&
      typeof result.error.status === 'number' &&
      result.error.status < 500 &&
      ![408, 409].includes(result.error.status)
    )
      return result;
    return await verifyEmployeeAction(input, query, actor);
  } catch (error) {
    return submitted
      ? uncertain(input.action)
      : fail(error instanceof Error ? error.message : 'تعذر التحقق من الموظف.');
  } finally {
    pending.delete(key);
  }
}
