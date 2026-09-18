import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
const i18n = createInstance();
void i18n.use(initReactI18next).init({
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  resources: {
    ar: {
      translation: {
        loading: 'جارٍ التحميل',
        retry: 'إعادة المحاولة',
        empty: 'لا توجد بيانات',
        logout: 'تسجيل الخروج',
      },
    },
  },
});
export default i18n;
