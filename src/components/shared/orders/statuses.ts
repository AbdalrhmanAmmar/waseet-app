// Existing API values; the server remains authoritative for allowed transitions.
export const orderStatuses = [
  { value: 'Processing', label: 'قيد المعالجة' },
  { value: 'Confirmed', label: 'مؤكد' },
  { value: 'Out for Delivery', label: 'خرج للتوصيل' },
  { value: 'Delivered', label: 'تم التوصيل' },
  { value: 'Postponed', label: 'مؤجل' },
  { value: 'Stuck', label: 'متعثر' },
  { value: 'Refused on Delivery', label: 'مرفوض عند التسليم' },
  { value: 'Cancelled', label: 'ملغي' },
  { value: 'Closed', label: 'مغلق' },
] as const;
export function statusLabel(status: string) {
  return (
    orderStatuses.find((item) => item.value.toLowerCase() === status?.toLowerCase())?.label ??
    status
  );
}
