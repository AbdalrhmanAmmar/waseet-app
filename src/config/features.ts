// These features have no published endpoints in the new server's Swagger (2026-09-18).
// Enable only after implementing and validating the corresponding backend adapters.
export const backendFeatures = {
  passwordReset: false,
  favorites: false,
  notificationHistory: false,
};
export const unavailableMessages = {
  passwordReset:
    'استعادة كلمة المرور غير متاحة حاليًا. تواصل مع الإدارة للمساعدة في استعادة حسابك.',
  favorites: 'المفضلة غير متاحة حاليًا.',
  notificationHistory: 'سجل الإشعارات غير متاح حاليًا.',
};
