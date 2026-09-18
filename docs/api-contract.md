# مطابقة الخادم الجديد

تمت قراءة Swagger بتاريخ 2026-09-18 بنجاح HTTP 200 من:

[Swagger JSON](https://smart-broker-bcd9bzfvagd5f8dx.westus-01.azurewebsites.net/swagger/v1/swagger.json)

عنوان API:
`https://smart-broker-bcd9bzfvagd5f8dx.westus-01.azurewebsites.net/api/`

| الاستخدام | المسار | ما طوبق |
| --- | --- | --- |
| الدخول | POST Auth/login | email, password |
| التسجيل | POST Auth/register | الأسماء والهاتف والدولة والعنوان والبريد وكلمة المرور والدور والميلاد والمدينة |
| الملف الشخصي | GET / PUT User/{id} | تحديث الأسماء والعنوان والدولة والهاتف؛ البريد للعرض فقط، والدور غير قابل للتعديل في الواجهة |
| المنتجات | GET Product/all | page, pageSize |
| تفاصيل المنتج | GET Product/{id} | المعرف ضمن المسار |
| أسعار التاجر | GET price-lists/{id} | يستخدم priceListId للمستخدم |
| مناطق التوصيل | GET delivery-areas | لا يوجد بديل برسوم وهمية |
| الطلبات | GET orders | pagination |
| طلبات المندوب | GET orders/my-deliveries | قائمة التوصيل المخصصة |
| تفاصيل وتاريخ الطلب | GET orders/{id}, orders/{id}/history | شاشة التفاصيل والتتبع |
| إنشاء طلب | POST orders | customerName, customerMobile, customerArea, customerAddress, items |
| عنصر الطلب | ضمن items | productCode, quantity, actualSellPriceUSD, color إذا توفر |
| الحالات | GET orders/statuses | قراءة الحالات بدل اختراعها محليًا |
| تغيير الحالة | POST orders/{id}/status | targetStatus, note اختياري؛ سبب مطلوب في الواجهة عند التعثر |

Swagger يعلن غالبية استجابات النجاح بوصف `OK` دون response schemas. لذلك مطابقة طرق الطلب وحقوله مؤكدة من التوثيق؛ تطبيع الاستجابات مبني على العملاء الموجودين ويحتاج اختبار حسابات حقيقية لكل دور. قراءة `orders/statuses` دون توكن أعادت HTTP 401، وهو دليل على الحاجة إلى مصادقة، وليس اختبارًا لوظائف حساب مسجل.

## مسارات غير معلنة

لا يوجد في Swagger المنشور: forgot-password/verify-OTP/reset-password، favorites، notification-history، أو تسجيل push-token. أزيلت اتصالات `*.php` الموروثة من الربط الفعلي. `api/shared/account.ts` يرد بخطأ محلي واضح إذا استُدعي، وواجهات تلك الميزات تعرض عدم الإتاحة. خطوات استعادة كلمة المرور محفوظة تمهيدًا لربطها، لكن لا تُعرض للمستخدم حاليًا ولا تدعي إرسال كود.

هناك endpoints أخرى في Swagger، مثل طلبات السحب والتعيين والتقارير وإدارة المخزون؛ ليست توسيعًا تلقائيًا لنطاق نقل الشاشات القديمة، ولم تُضف لها شاشات جديدة ضمن هذا النقل.

## قبل الاعتماد التشغيلي

يلزم اختبار حساب فعلي لكل دور للتحقق من بنية بيانات الدخول والأسعار، ونطاق الطلبات، وانتقالات الحالة المسموحة، وصلاحية تعديل الملف الشخصي. الخادم هو مصدر الحكم على صلاحيات الطلبات والحسابات. جميع اختبارات المتصفح المرفقة تستخدم API محاكى؛ لم تُرسل معاملات كتابة إلى الخادم الحقيقي.
