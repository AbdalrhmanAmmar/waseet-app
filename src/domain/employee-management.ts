import {
  merchantBody,
  merchantCollection,
  merchantDate,
  merchantId,
  merchantRecord,
  merchantText,
  uniqueMerchantRecords,
} from './merchant-records';
export type MerchantEmployee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string | null;
};
export type EmployeeAction = 'Approved' | 'Rejected' | 'delete';
export const employeeStatusKey = (status: string) => status.trim().toLowerCase();
export function employeePresentation(status: string) {
  const key = employeeStatusKey(status);
  if (key === 'pending') return { label: 'بانتظار الموافقة', tone: 'pending' as const };
  if (key === 'approved') return { label: 'مقبول', tone: 'success' as const };
  if (key === 'rejected') return { label: 'مرفوض', tone: 'danger' as const };
  return { label: status || 'غير محدد', tone: 'neutral' as const };
}
function employeeRecord(value: unknown, ownerId: string): MerchantEmployee {
  const row = merchantRecord(value);
  if (row.role != null && String(row.role).trim().toLowerCase() !== 'merchantemployee')
    throw new Error('هذا الحساب ليس موظف تاجر.');
  // The scoped endpoint establishes membership when older responses omit ownerMerchantId.
  if (row.ownerMerchantId != null && merchantId(row.ownerMerchantId) !== merchantId(ownerId))
    throw new Error('هذا الموظف غير تابع لحسابك.');
  return {
    id: merchantId(row.userId ?? row.id),
    name:
      [row.firstName, row.secondName, row.lastName].map(merchantText).filter(Boolean).join(' ') ||
      merchantText(row.fullName) ||
      'موظف',
    email: merchantText(row.email),
    phone: merchantText(row.phoneNumber),
    status: merchantText(row.accountStatus ?? row.status) ?? '',
    createdAt: merchantDate(row.createdAt),
  };
}
export function readMerchantEmployees(value: unknown, ownerId: string) {
  merchantId(ownerId);
  return uniqueMerchantRecords(
    merchantCollection(value).map((row) => employeeRecord(row, ownerId)),
  );
}
export function readMerchantEmployee(value: unknown, ownerId: string, id: string) {
  const employee = employeeRecord(merchantBody(value), ownerId);
  if (employee.id !== merchantId(id)) throw new Error('استجابة الخادم تخص موظفًا آخر.');
  return employee;
}
export function employeeActionAllowed(employee: MerchantEmployee, action: EmployeeAction) {
  return (
    action === 'delete' ||
    (['pending', 'approved', 'rejected'].includes(employeeStatusKey(employee.status)) &&
      employeeStatusKey(employee.status) !== employeeStatusKey(action))
  );
}
export const employeeActionCopy = {
  Approved: {
    title: 'تأكيد الموافقة',
    confirm: 'تأكيد الموافقة',
    description: 'هل تريد الموافقة على هذا الموظف؟ سيصبح حسابه مقبولًا.',
    success: 'تمت الموافقة على الموظف.',
  },
  Rejected: {
    title: 'رفض الموظف',
    confirm: 'تأكيد الرفض',
    description: 'هل تريد رفض حساب هذا الموظف؟ سيخضع دخوله لحالة الحساب الجديدة.',
    success: 'تم رفض حساب الموظف.',
  },
  delete: {
    title: 'حذف الموظف',
    confirm: 'تأكيد الحذف',
    description: 'هل تريد حذف هذا الموظف؟ سيُرسل طلب حذف حسابه إلى الخادم.',
    success: 'تم حذف الموظف.',
  },
};
