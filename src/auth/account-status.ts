export function accountStatusContent(status?: string) {
  switch (status?.trim().toLowerCase()) {
    case 'rejected':
      return {
        pending: false,
        badge: 'يحتاج إلى مراجعة',
        title: 'لم تتم الموافقة على حسابك',
        description: 'تواصل مع فريق الدعم لمعرفة التفاصيل والخطوات المطلوبة لمراجعة حسابك.',
        step: 'مراجعة البيانات',
        detail: 'لم تتم الموافقة',
        icon: 'close-circle-outline' as const,
      };
    case 'blocked':
    case 'suspended':
      return {
        pending: false,
        badge: 'الحساب موقوف',
        title: 'حسابك موقوف حاليًا',
        description: 'تواصل مع فريق الدعم للمساعدة في معرفة سبب الإيقاف والخطوات المتاحة لحسابك.',
        step: 'حالة الحساب',
        detail: 'موقوف حاليًا',
        icon: 'account-lock-outline' as const,
      };
    case 'inactive':
    case 'disabled':
      return {
        pending: false,
        badge: 'غير مفعّل',
        title: 'حسابك غير مفعّل حاليًا',
        description: 'تواصل مع فريق الدعم للمساعدة في تفعيل حسابك وبدء استخدام التطبيق.',
        step: 'حالة الحساب',
        detail: 'بانتظار التفعيل',
        icon: 'account-lock-outline' as const,
      };
    default:
      return {
        pending: true,
        badge: 'بانتظار التفعيل',
        title: 'حسابك قيد المراجعة',
        description:
          'حسابك وصلنا وفريق الإدارة بيراجع بياناتك. بمجرد تفعيله هتقدر تبدأ استخدام التطبيق.',
        step: 'مراجعة البيانات',
        detail: 'قيد المراجعة الآن',
        icon: 'clock-outline' as const,
      };
  }
}
