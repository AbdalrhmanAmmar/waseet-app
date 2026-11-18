import { balanceNumber } from './balance';
import {
  merchantCollection,
  merchantDate,
  merchantId,
  merchantRecord,
  merchantText,
  uniqueMerchantRecords,
} from './merchant-records';

export type WithdrawalRecord = {
  id: string;
  merchantUserId: string;
  amount: number | null;
  status: string;
  note: string | null;
  requestedAt: string | null;
  resolvedAt: string | null;
  adminNote: string | null;
};
export const financeStatusKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
export function withdrawalPresentation(status: string) {
  const key = financeStatusKey(status);
  if (key === 'pending') return { label: 'بانتظار المراجعة', tone: 'pending' as const };
  if (key === 'approved') return { label: 'تمت الموافقة', tone: 'success' as const };
  if (key === 'rejected') return { label: 'مرفوض', tone: 'danger' as const };
  if (key === 'returnedforrevision') return { label: 'مطلوب تعديل', tone: 'pending' as const };
  return { label: status || 'غير محدد', tone: 'neutral' as const };
}
export function readMerchantWithdrawals(value: unknown, ownerId: string): WithdrawalRecord[] {
  const owner = merchantId(ownerId);
  const items = merchantCollection(value).map((raw) => {
    const row = merchantRecord(raw);
    const merchantUserId = merchantId(row.merchantUserId);
    if (merchantUserId !== owner) throw new Error('تعذر التحقق من أن سجل السحوبات يخص حسابك.');
    const amount = balanceNumber(row.amount);
    return {
      id: merchantId(row.withdrawalRequestId ?? row.id),
      merchantUserId,
      amount: amount !== null && amount >= 0 ? amount : null,
      status: merchantText(row.status) ?? '',
      note: merchantText(row.note),
      requestedAt: merchantDate(row.requestedAt),
      resolvedAt: merchantDate(row.resolvedAt),
      adminNote: merchantText(row.adminNote),
    };
  });
  return uniqueMerchantRecords(items).sort(
    (a, b) =>
      (Date.parse(b.requestedAt ?? '') || 0) - (Date.parse(a.requestedAt ?? '') || 0) ||
      Number(b.id) - Number(a.id),
  );
}
export const withdrawalStatuses = [
  { value: '', label: 'الكل' },
  { value: 'Pending', label: 'بانتظار المراجعة' },
  { value: 'Approved', label: 'تمت الموافقة' },
  { value: 'Rejected', label: 'مرفوض' },
];
export type WithdrawalFilters = { status?: string; fromDate?: string; toDate?: string };
export function withdrawalFilterError(filters: WithdrawalFilters) {
  for (const value of [filters.fromDate, filters.toDate]) {
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value)
    )
      return 'اكتب تاريخًا صحيحًا بصيغة YYYY-MM-DD.';
  }
  if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate)
    return 'تاريخ البداية يجب أن يسبق تاريخ النهاية.';
  if (filters.status && !withdrawalStatuses.some((item) => item.value === filters.status))
    return 'فلتر الحالة غير صالح.';
  return null;
}
export function withdrawalTotal(items: WithdrawalRecord[]): number | null {
  if (items.some((item) => item.amount === null)) return null;
  const cents = items.reduce((sum, item) => sum + Math.round(item.amount! * 100), 0);
  return Number.isSafeInteger(cents) ? cents / 100 : null;
}
export function merchantDisplayDate(value: string | null, time = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'غير متاح';
  return new Date(value).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(time ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}
