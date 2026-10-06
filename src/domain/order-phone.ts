import type { DeliveryMode } from './order-workflow';
export const phoneDigits = (value: string) =>
  value
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776));
export function primaryPhoneError(value: string, mode: DeliveryMode): string | null {
  if (!value.trim()) return 'رقم هاتف العميل مطلوب';
  if (mode === 'unknown') return 'اختر منطقة توصيل صحيحة لتحديد شروط الهاتف';
  if (mode === 'external' && !/^09\d{8}$/.test(phoneDigits(value).trim()))
    return 'الطلب الخارجي يتطلب رقمًا سوريًا يبدأ بـ 09 ويتكون من 10 أرقام';
  return null;
}
export const primaryPhonePayload = (value: string, mode: DeliveryMode) =>
  mode === 'external' ? phoneDigits(value).trim() : value.trim();
