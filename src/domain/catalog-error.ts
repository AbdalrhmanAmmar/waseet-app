export function catalogErrorMessage(error: unknown): string {
  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
  if (status === 401) return 'لم يقبل الخادم جلسة الدخول. سجّل الدخول مجددًا. (401)';
  if (status === 403) return 'حسابك لا يملك صلاحية عرض المنتجات. تواصل مع الإدارة. (403)';
  if (status === 429) return 'طلبات كثيرة في وقت قصير. انتظر قليلًا ثم أعد المحاولة. (429)';
  if (typeof status === 'number' && status >= 500)
    return `حدث خطأ في الخادم. أعد المحاولة بعد قليل. (${status})`;
  if (status === 'NETWORK_ERROR')
    return 'تعذر الاتصال بالخادم أو انتهت مهلة الطلب. تحقق من الاتصال ثم أعد المحاولة.';
  if (status === 'INVALID_RESPONSE') return 'استجابة الخادم لا تحتوي على بيانات منتجات صالحة.';
  if (typeof status === 'number') return `تعذر إتمام طلب المنتجات. رمز الاستجابة: ${status}.`;
  return 'تعذر قراءة بيانات المنتجات. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم.';
}
