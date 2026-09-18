# وسيط — تطبيق Expo

نقل تطبيق `../reactnative` إلى Expo SDK 57 وتنظيمه لأربعة أدوار: `Merchant` و`SalesEmployee` و`ManagementEmployee` و`DeliveryAgent`.

## التشغيل

المتطلبات: Node.js 22.13 أو أحدث ضمن الإصدارات المدعومة، وnpm. استُخدمت [وثائق Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) أثناء النقل.

```sh
npm ci
cp .env.example .env
npm start
```

الخادم الافتراضي، ويمكن تغييره عبر `EXPO_PUBLIC_API_URL`:

```text
https://smart-broker-bcd9bzfvagd5f8dx.westus-01.azurewebsites.net/api/
```

بعد تغيير متغيرات البيئة أعد تشغيل Metro؛ أي نسخة منشورة تحتاج بناء/تصديرًا جديدًا لتضمين العنوان. قيم `EXPO_PUBLIC_*` عامة وليست مكانًا لكلمات المرور أو الأسرار.

```sh
npm run web
npm run android
npm run ios
```

لإنشاء development build محليًا (يتطلب Android SDK أو Xcode حسب المنصة):

```sh
npm run android:build
npm run ios:build
```

الأوامر `npm start` و`npm run ios` و`npm run android` تستخدم Expo Go افتراضيًا لتجربة الشاشات، مع نسخة متوافقة مع SDK 57. اختبار الإشعارات البعيدة يحتاج development build وجهازًا وإعدادات FCM/APNs؛ لا يعمل في Expo Go في هذا المشروع.

للتشغيل بنسخة development build بعد بنائها وتثبيتها استخدم `npm run start:dev` أو `npm run ios:dev` أو `npm run android:dev`.

إذا ظهرت رسالة `No development build (com.selling) ... is installed` أثناء تجربة الشاشات، اضغط `s` في جلسة Expo الحالية للتحويل إلى Expo Go ثم `i` للمحاكي. أو أوقف الجلسة بـCtrl+C وشغّل `npm run ios`. تغيير scripts لا يغير وضع جلسة Metro المفتوحة بالفعل.

## التنظيم

```text
src/
  app/                         # مسارات Expo Router فقط
    (auth)/
    (protected)/
      merchant/
      sales-employee/
      management-employee/
      delivery-agent/
      account/                 # حسابي، الدعم، الصفحات المشتركة
    account-status.tsx
  api/                         # client + base-api + normalizers
    shared/
    merchant/
    sales-employee/
    management-employee/
    delivery-agent/
  components/                  # نفس الأقسام الخمسة
  hooks/                       # نفس الأقسام الخمسة
  screens/                     # auth + shared + الأدوار الأربعة
  auth/                        # الأدوار والصلاحيات وتطبيع الجلسة
  store/                       # Redux: جلسة + سلة + RTK Query
  services/                    # التخزين وإشعارات الجهاز
  schemas/                     # تحقق النماذج
  types/                       # عقود البيانات المشتركة
  config/                      # الخادم والميزات والتواصل
  theme/                       # ألوان وخطوط وأصول
  locales/                     # أساس الترجمة
```

الشاشة المشتركة تستقبل بياناتها وأفعالها من controller خاص بالدور. الاتصالات المتطابقة يعاد استخدامها من `api/shared`؛ لا نكرر نفس الطلب أربع مرات لمجرد أن له أربعة مستخدمين. ملفات `src/app` تربط المسارات بالشاشات فقط.

## الصلاحيات الحالية

| الدور | واجهة العمل |
| --- | --- |
| Merchant | منتجات وأسعار التاجر، سلة، إنشاء ومتابعة الطلبات، أرباح الطلب |
| SalesEmployee | منتجات، سلة، إنشاء ومتابعة الطلبات، دون مكون أرباح التاجر |
| ManagementEmployee | متابعة الطلبات وتغيير الحالة |
| DeliveryAgent | طلبات التوصيل المسندة إليه من `orders/my-deliveries` وتغيير الحالة |

الحسابات المعلقة أو المحظورة أو المعطلة تُوجّه إلى صفحة حالة الحساب. الدور غير المعروف يُرفض. حماية المسارات تمنع الدخول إلى مساحة دور آخر، لكن الخادم مسؤول عن صلاحيات البيانات وانتقالات حالات الطلب الفعلية.

## الفحوصات

```sh
npm run typecheck
npm run lint
npm test
npm run format:check
npm run export:check
npx playwright install chromium
npm run test:e2e
```

`test:e2e` يصدر نسخة web ثم يشغل Chromium بحجم شاشة هاتف. يحتاج Python 3 لخادم المعاينة. اختبارات المتصفح تعترض اتصالات API وتستخدم بيانات اختبار؛ لا تنشئ حسابات أو طلبات على الخادم الحقيقي.

## حدود الربط الحالي

- Swagger الجديد يعلن مسارات الدخول والتسجيل والمنتجات والطلبات والمستخدمين. تفاصيل المطابقة في [عقد API](docs/api-contract.md).
- استعادة كلمة المرور والمفضلة وسجل الإشعارات غير معلنة في Swagger؛ تظهر كميزات غير متاحة. تم منع استدعاء مسارات PHP ومسارات الاستعادة القديمة. تحتاج adapters مطابقة لتوثيق backend قبل تفعيلها.
- تسجيل push token اختياري عبر `EXPO_PUBLIC_PUSH_TOKEN_PATH` بعد تأكيد عقده. إعداد Firebase عبر `GOOGLE_SERVICES_JSON`، وربط مشروع EAS عبر `EXPO_PUBLIC_EAS_PROJECT_ID`. لا يحتوي المشروع على بيانات اعتماد جاهزة.
- التوكن محفوظ في SecureStore على الهاتف. على الويب يُحفظ في الذاكرة فقط؛ إعادة تحميل الصفحة تستلزم تسجيل الدخول. السلة أيضًا في الذاكرة وتُمسح عند تسجيل الخروج.
- الترجمة مؤسَّسة باستخدام i18next، لكن لم تُستخرج كل النصوص القديمة إلى ملفات ترجمة. الواجهة الحالية عربية أساسًا.
- بيانات التواصل في `src/config/contact.ts` من المشروع السابق وتحتاج مراجعة صاحب التطبيق قبل النشر.

راجع [التقرير التفصيلي للنقل](docs/migration-report.ar.md) و[قواعد التنظيم](docs/architecture.md).

## الأيقونة وشاشة البداية

تستخدمان شعار Dashboard الأصلي من `assets/branding/logo.svg`، مع نسخ مستقلة للأيقونة وAndroid Adaptive/Themed وSplash والويب. أعد توليد الأصول باستخدام `npm run assets:generate`. راجع [دليل الهوية والمعاينة](docs/branding.md) لتفاصيل الملفات وطريقة اختبارها؛ الشكل النهائي لشاشة البداية يحتاج release build.

## التصميم وتجربة التسجيل

تعتمد الواجهة على هوية وسيط وخط Tajawal المحلي. التسجيل مقسم إلى ثلاث خطوات، دون حقل رقم أوليفر، مع تحقق لتاريخ الميلاد والمدخلات. راجع [تقرير إعادة التصميم والاختبارات](docs/redesign-report.ar.md) للواجهات والتفاصيل وحدود التحقق.
