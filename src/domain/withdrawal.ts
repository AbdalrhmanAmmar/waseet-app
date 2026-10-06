export function amountCents(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٫,]/g, '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}
export function balanceCents(value: unknown): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '')
    return null;
  const balance = Number(value);
  const cents = Math.floor(balance * 100 + 1e-7);
  return Number.isFinite(balance) && balance >= 0 && Number.isSafeInteger(cents) ? cents : null;
}
export function withdrawalError(amount: string, balance: unknown): string | null {
  const cents = amountCents(amount);
  const available = balanceCents(balance);
  if (cents === null) return 'أدخل مبلغًا صحيحًا بحد أقصى منزلتين عشريتين';
  if (cents <= 0) return 'يجب أن يكون المبلغ أكبر من صفر';
  if (available === null) return 'تعذر التأكد من الرصيد. حدّث بيانات الحساب أولًا';
  if (cents > available) return 'المبلغ المطلوب أكبر من رصيد حسابك';
  return null;
}
