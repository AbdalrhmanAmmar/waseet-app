// Scoped merchant endpoints have no response schemas in Swagger. Reject malformed or
// incomplete collections rather than presenting a partial list as a complete history.
export function merchantRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('تعذر قراءة البيانات. حدّث الصفحة للمحاولة مجددًا.');
  return value as Record<string, unknown>;
}
export function merchantBody(value: unknown): unknown {
  const root = merchantRecord(value);
  if (root.isSuccess === false || root.success === false)
    throw new Error(typeof root.message === 'string' ? root.message : 'رفض الخادم الطلب.');
  return root.data === undefined ? root : root.data;
}
export function merchantCollection(value: unknown): unknown[] {
  const body = Array.isArray(value) ? value : merchantBody(value);
  if (Array.isArray(body)) return body;
  const record = merchantRecord(body);
  if (!Array.isArray(record.items)) throw new Error('تعذر قراءة القائمة من الخادم.');
  if (
    Number(record.totalCount ?? record.items.length) !== record.items.length ||
    Number(record.totalPages ?? 1) > 1
  )
    throw new Error('القائمة غير مكتملة. حدّث الصفحة أو تواصل مع الدعم.');
  return record.items;
}
export function merchantId(value: unknown): string {
  if (
    !['number', 'string'].includes(typeof value) ||
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) <= 0
  )
    throw new Error('تعذر التحقق من معرّف السجل.');
  return String(Number(value));
}
export const merchantText = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
export const merchantDate = (value: unknown) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
export function uniqueMerchantRecords<T extends { id: string }>(items: T[]) {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error('بيانات القائمة غير متسقة. حدّث الصفحة للمحاولة مجددًا.');
  return items;
}
