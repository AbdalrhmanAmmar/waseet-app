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

// Syrian local mobile numbers need their country code for WhatsApp click-to-chat.
export function customerWhatsAppUrl(value?: string | null): string | null {
  if (!value) return null;
  let digits = phoneDigits(value)
    .trim()
    .replace(/[\s().-]/g, '');
  if (/^09\d{8}$/.test(digits)) digits = `963${digits.slice(1)}`;
  else if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (!/^9639\d{8}$/.test(digits)) return null;
  return /^[1-9]\d{7,14}$/.test(digits) ? `https://wa.me/${digits}` : null;
}
