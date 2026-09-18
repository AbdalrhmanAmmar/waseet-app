import type { Product } from '@/types/models';
import { API_URL } from '@/config/env';
export function optionalPrice(value: unknown): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
export function suggestedPrice(product: Product): number | null {
  return (
    optionalPrice(product.effectiveExpectedSellPrice) ?? optionalPrice(product.expectedSellPrice)
  );
}
export function mediaUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim(), API_URL.replace(/api\/$/, ''));
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function formatMoney(value: number | null) {
  return value == null
    ? 'غير محدد'
    : `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}
export function updatedDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(date);
}

export function detailsFailure(error: unknown, price: boolean) {
  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
  const title = price ? 'تعذر تحميل سعر التاجر' : 'تعذر تحميل تفاصيل المنتج';
  let message = 'تعذر إتمام الطلب. حاول مرة أخرى.';
  if (status === 401) message = 'انتهت صلاحية الجلسة أو لم يقبلها الخادم. سجّل الدخول مجددًا.';
  else if (status === 403)
    message = price
      ? 'الخادم لا يسمح لحسابك بالوصول إلى سعر التاجر. تواصل مع الإدارة لمراجعة الصلاحيات.'
      : 'الخادم لا يسمح لحسابك بعرض تفاصيل هذا المنتج. تواصل مع الإدارة لمراجعة الصلاحيات.';
  else if (status === 'NETWORK_ERROR')
    message = 'تعذر الاتصال بالخادم. تحقق من الإنترنت وأعد المحاولة.';
  else if (status === 'INVALID_RESPONSE')
    message = price
      ? 'بيانات السعر الواردة غير صالحة أو لا تطابق الحساب والمنتج.'
      : 'بيانات المنتج الواردة غير صالحة أو لا تطابق المنتج المطلوب.';
  else if (typeof status === 'number' && status >= 500)
    message = 'حدث خطأ في الخادم أثناء تحميل البيانات. أعد المحاولة بعد قليل.';
  return { title, message };
}
