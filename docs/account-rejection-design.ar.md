# تنفيذ شاشة عدم الموافقة على الحساب

## النتيجة

أصبحت حالة `Rejected` تعرض تصميمًا مستقلًا عن الحساب قيد المراجعة والموقوف، مطابقًا لترتيب وعناصر المعاينة المعتمدة: شعار وسيط، رسمة الحساب والمستند وعلامة التنبيه، شارة «نتيجة مراجعة الحساب»، العنوان والترحيب، شرح النتيجة، السبب الاختياري، الخطوة التالية، رقم الحساب والأزرار.

الواجهة مبنية بعناصر React Native فعلية وليست لقطة شاشة؛ يمكن تحديد النص ونسخ الرقم والضغط على الأزرار. الخلفية فاتحة، الألوان خضراء مع تنبيه كهرماني، والخط Tajawal. تدعم المساحات الآمنة والتمرير على الشاشات الصغيرة. الساعة وشريط النظام من الجهاز، ولا تُرسم عناصر نظام وهمية.

## الرسمة المستخدمة

- الأصل المحلي: `assets/images/account-rejected.png`، بحجم 1448×1086 وقناة شفافية فعلية.
- استُخدمت أداة imagegen المدمجة لاستخراج رسمة البطاقة والمستند وعلامة التعجب من المعاينة؛ قد تختلف تفاصيل الرسم الدقيقة بسبب الاستخراج التوليدي. لم يُستخدم CLI أو مفتاح API.
- بقية التصميم نصوص وبطاقات وأزرار برمجية. العمود التوضيحي على يسار المعاينة ليس جزءًا من شاشة الهاتف.
- لم تتغير رسمة الحساب المعلق `account-review.png`.

نص توجيه الاستخراج المستخدم:

> Use case: background-extraction. Edit target: attached Arabic mobile app design board. Extract ONLY the main illustration in the upper part of the RIGHT mobile screen: ivory rounded profile ID card with green avatar and green lines in front, tilted ivory document behind, amber circular exclamation badge overlapping bottom right, pale mint organic oval and small mint dots behind. Preserve these exact objects, materials, colors, relative arrangement and soft 3D clay style from reference. Output isolated production-ready illustration with actual transparent background, tightly framed with about 5% clear margin, landscape 4:3 composition. Remove all UI, phone, logos, typography, labels, text, borders, status bars, buttons and the entire left column. No clock, no words, no watermark. Keep only this illustration with clean alpha edges.

## السلوك والبيانات

- عند وجود جلسة حقيقية بحالة `Rejected` تظهر الشاشة على `/account-status`، ويجلب زر التحديث ملف المستخدم. تستمر مراجعة الحالة عند العودة للتطبيق؛ الانتقال من رفض إلى Pending يعرض شاشة المراجعة، وإلى Approved ينقل لمساحة الدور المناسبة.
- عند رفض الدخول بدون token تُعرض الواجهة داخل مسار الدخول، دون اختلاق جلسة أو إرسال طلبات محمية. تتوفر إعادة تسجيل الدخول والعودة للنموذج؛ تُمسح كلمة المرور ويبقى البريد.
- يدعم تحديد الحالة قيمة `accountStatus` الصريحة، ثم الرسائل الصريحة بالعربية والإنجليزية. العبارات التي تتضمن «بعد» أو «not yet approved» تُصنف Pending، والحالة الصريحة من الخادم لها الأولوية.
- الاسم ورقم الحساب من البيانات الفعلية فقط. لا يُعرض أحمد أو الرقم 1024 كقيم افتراضية.
- بطاقة السبب تظهر فقط عند وجود `rejectionReason` نصي غير فارغ. لا تُعرض أخطاء النظام أو الملاحظات الداخلية أو سبب المثال المصور. يُزال السبب القديم إذا لم يرسله ملف المستخدم الجديد.
- يحافظ عميل API على حقول المراجعة المحددة فقط في أخطاء `Auth/login`، بدل إسقاطها والاكتفاء برسالة الخطأ. لا تُمرر كلمات مرور أو tokens عبر بيانات الرفض.
- التواصل مع الدعم يفتح النافذة المشتركة، ومنها وسائل الاتصال الموجودة في إعدادات المشروع. لا تُرسل رسائل تلقائيًا.
- نسخ رقم الحساب يستخدم `expo-clipboard` المتوافق مع SDK 57، مع تأكيد النجاح أو رسالة فشل وإمكانية تحديد الرقم يدويًا.
- تعرض أخطاء التحديث رسالة وإمكانية إعادة المحاولة؛ الطلب الجاري لا يتكرر عند الضغط.

## حدود عقد الخادم

تمت قراءة Swagger الفعلي في 18 سبتمبر 2026. يوثّق `POST /api/Auth/login` و`GET /api/User/{id}` دون مخطط تفصيلي لبيانات الاستجابة. لذلك `rejectionReason` حقل اختياري تدعمه الواجهة عند إرساله، وليس ادعاءً بأن الخادم الحالي يرسله دائمًا. تُقبل بيانات المراجعة في الجسم أو `data` أو `data.user`.

لا يوجد مسار موثّق لإعادة تقديم طلب حساب، لذا زر «تعديل البيانات وإعادة تقديم الطلب» مخفي. مسار `PUT /api/User/{id}/status` لا يُستخدم لإعادة التقديم أو تغيير حالة الحساب ذاتيًا. مسار `withdrawal-requests/{id}/resubmit` يخص طلبات السحب وليس تسجيل الحساب. إتاحة إعادة التقديم لاحقًا تتطلب عقدًا وصلاحيات واضحة من الخادم.

## الملفات الرئيسية

- `src/components/shared/account/RejectedAccountContent.tsx`: التصميم والأزرار ونسخ الرقم.
- `src/screens/shared/AccountStatusScreen/index.tsx`: اختيار شاشة الرفض وتوصيل تحديث الحالة والدعم والخروج.
- `src/auth/account-review.ts`: استخراج الحقول المسموحة فقط.
- `src/auth/login-restriction.ts`: تمييز حالات الرفض والانتظار.
- `src/screens/auth/Login/index.tsx`: العرض بدون جلسة عند رفض الدخول.
- `src/api/client.ts` و`src/store/slices/auth.ts`: الحفاظ على تفاصيل المراجعة الاختيارية عبر أخطاء الدخول.
- `src/auth/session.ts`: إزالة سبب الرفض القديم عند تحديث الملف.
- `package.json` و`package-lock.json`: إضافة expo-clipboard.

## التحقق

نجحت الفحوص التالية:

- TypeScript وESLint وPrettier.
- اختبارات الوحدات: 16 من 16.
- اختبارات الواجهة: 30 من 30، تشمل 5 سيناريوهات جديدة لشاشة الرفض: السبب والنسخ والدعم وأخطاء التحديث ثم الانتقال إلى Pending وApproved؛ العرض بدون سبب والخروج على عرض 320px؛ رفض الدخول بدون جلسة عبر HTTP 200 و401 و403.
- تصدير حزم Web وiOS وAndroid.
- معاينة لقطة الشاشة الفعلية بصريًا، مع تحقق وجود قناة شفافية في الرسمة.

اختبارات المتصفح تستخدم خادم API محاكى؛ لم يُنشأ حساب حقيقي أو تُعدل حالة مستخدم على الخادم. نجاح تصدير iOS وAndroid لا يعني اختبار شاشة الرفض فعليًا على جهاز أصلي أو بناء إصدار متجر. لقطة المعاينة تستخدم بيانات اختبار، بينما التطبيق يعرض القيم الفعلية فقط.

[معاينة الشاشة المنفذة](redesign-preview/account-rejected.png)

لتجربتها في Expo Go: أعد تشغيل Metro باستخدام `npm start -- --clear` إذا كانت الجلسة القديمة لم تلتقط الحزمة الجديدة، ثم افتح التطبيق وسجّل الدخول بحساب يعيد الخادم له حالة Rejected أو رسالة الرفض الصريحة.

المراجع المستخدمة: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)، [Clipboard SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/clipboard/)، [Swagger الخادم](https://smart-broker-bcd9bzfvagd5f8dx.westus-01.azurewebsites.net/swagger/v1/swagger.json).
