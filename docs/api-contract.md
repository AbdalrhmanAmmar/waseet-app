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
| تفاصيل المنتج | GET Product/{id} | المعرف ضمن المسار؛ البيانات والأسعار من نفس الاستجابة دون طلب merchant-price إضافي |
| أسعار كتالوج التاجر | GET Product/all | تُقرأ من نفس استجابة المنتجات؛ لا يُطلب price-lists حتى عند وجود priceListId للحساب |
| مناطق التوصيل | GET delivery-areas | لا يوجد بديل برسوم وهمية |
| الطلبات | GET orders | pagination |
| طلبات المندوب | GET orders/my-deliveries | قائمة التوصيل المخصصة |
| تفاصيل وتاريخ الطلب | GET orders/{id}, orders/{id}/history | شاشة التفاصيل والتتبع |
| إنشاء طلب | POST orders | customerName, customerMobile, customerArea, customerAddress, items |
| عنصر الطلب | ضمن items | productCode, quantity, actualSellPriceUSD, color إلزامي في واجهة الإنشاء |
| الحالات | GET orders/statuses | قراءة الحالات بدل اختراعها محليًا |
| تغيير الحالة | POST orders/{id}/status | targetStatus, note اختياري؛ سبب مطلوب في الواجهة عند التعثر |

Swagger يعلن غالبية استجابات النجاح بوصف `OK` دون response schemas. لذلك مطابقة طرق الطلب وحقوله مؤكدة من التوثيق؛ تطبيع الاستجابات مبني على العملاء الموجودين ويحتاج اختبار حسابات حقيقية لكل دور. قراءة `orders/statuses` دون توكن أعادت HTTP 401، وهو دليل على الحاجة إلى مصادقة، وليس اختبارًا لوظائف حساب مسجل.

## مسارات غير معلنة

لا يوجد في Swagger المنشور: forgot-password/verify-OTP/reset-password، favorites، notification-history، أو تسجيل push-token. أزيلت اتصالات `*.php` الموروثة من الربط الفعلي. `api/shared/account.ts` يرد بخطأ محلي واضح إذا استُدعي، وواجهات تلك الميزات تعرض عدم الإتاحة. خطوات استعادة كلمة المرور محفوظة تمهيدًا لربطها، لكن لا تُعرض للمستخدم حاليًا ولا تدعي إرسال كود.

هناك endpoints أخرى في Swagger، مثل طلبات السحب والتعيين والتقارير وإدارة المخزون؛ ليست توسيعًا تلقائيًا لنطاق نقل الشاشات القديمة، ولم تُضف لها شاشات جديدة ضمن هذا النقل.

## قبل الاعتماد التشغيلي

يلزم اختبار حساب فعلي لكل دور للتحقق من بنية بيانات الدخول والأسعار، ونطاق الطلبات، وانتقالات الحالة المسموحة، وصلاحية تعديل الملف الشخصي. الخادم هو مصدر الحكم على صلاحيات الطلبات والحسابات. جميع اختبارات المتصفح المرفقة تستخدم API محاكى؛ لم تُرسل معاملات كتابة إلى الخادم الحقيقي.

## إنشاء الطلب المباشر

استُبدلت السلة بنموذج مشترك للتاجر وموظف المبيعات: العميل، الهاتف السوري، المنطقة، العنوان، ثم المنتجات والكمية وسعر البيع واللون. اللون نص حر مطلوب لكل عنصر، بحد 50 حرفًا، وفق نموذج الداشبورد. Swagger يعرّف الحقل nullable؛ إلزامه هنا قاعدة تحقق في واجهة الإنشاء.

تُحدَّث مناطق التوصيل وبيانات كل منتج مختار عبر `Product/{id}` قبل فتح المراجعة. لا تُستخدم `price-lists` أو `merchant-price`. لا يُرسل إجمالي محسوب من الهاتف في payload؛ الخادم يحسب القيمة النهائية. لا توجد إعادة إرسال تلقائية لـPOST عند انقطاع الشبكة أو فشل الخادم بنتيجة غير مؤكدة.

مثال payload:

```json
{
  "customerName": "عميل اختبار",
  "customerMobile": "0912345678",
  "customerArea": "دمشق",
  "customerAddress": "شارع النصر، بجوار المكتبة",
  "items": [{ "productCode": 8, "quantity": 2, "actualSellPriceUSD": 32.5, "color": "أسود" }]
}
```

## ملخص الرئيسية والرسم

`GET orders` يدعم Status وFromDate وToDate مع pagination. الملخص يقرأ totalCount للإجمالي وProcessing وDelivered، والرسم يحمّل صفحات الفترة كاملة ويتحقق من العدد والتواريخ قبل العرض. لا تُستخدم واجهة admin/dashboard للتاجر. [تفاصيل الربط والحدود](home-dashboard.ar.md).

الرصيد يُقرأ من dollarBalance في بيانات الدخول والحساب. إذا لم يُرجع تحديث الحساب قيمة صالحة، تظهر القيمة السابقة بصفتها آخر رصيد معروف، لا بوصفها تحديثًا ناجحًا. لا يوجد طلب تعديل رصيد ضمن هذا التنفيذ.


## واجهة المندوب وتحديث الحالة

شاشة المندوب تحمل صفحات `GET orders/my-deliveries` بالتتابع وتبحث وتفلتر محليًا، مع بيان نقص نطاق البحث والأعداد قبل اكتمال الصفحات. فتح نافذة تغيير الحالة يجدد `GET orders/{id}` و`GET orders/statuses`، ثم يرسل `POST orders/{id}/status` بالحقول `targetStatus` و`note` الاختيارية بعد تأكيد المستخدم. يشترط سبب للحالة `Stuck`، ولا يسمح الحفظ عند تعذر التحقق أو نهائية الحالة. الخادم يظل صاحب قرار السماح بالانتقال.

روابط الاتصال تستخدم `customerMobile`، والخرائط بحث بالحقول `customerAddress` و`customerArea` فقط. لا يوجد حقل مبلغ تحصيل صريح في العقد الذي تمت مراجعته؛ لذلك لا تعرض شاشة المندوب `orderTotalUSD` تحت تسمية «المطلوب تحصيله».

## Sales product order options

`SalesEmployee` (including normalized `sales`) uses `GET Product/order-options` for the product list, order picker and pre-review revalidation. Contract supplied by the project owner: `{ isSuccess: true, message, data: [{ productCode, name, originalPrice, merchantSellPrice, expectedSellPrice, effectiveExpectedSellPrice }] }`. This is an unpaginated list. Sales normalization whitelists display fields and excludes `merchantSellPrice`; missing stock is not zero or a client-side ordering limit. No sales product detail GET is issued. Refreshing the options checks selected IDs without overwriting the operator's quantity, color or actual selling price. Stock validation remains authoritative on order submission. Merchant endpoints remain unchanged. See [sales workflow](sales-order-options.ar.md).

## Management orders workspace

Management continues to use `GET orders` with `page` and `pageSize`. Its redesigned workspace shares presentation and pagination logic with delivery, but never calls `orders/my-deliveries`. Status changes retain the existing `POST orders/{id}/status` contract and the `managementOrderStatus` mutation. Fresh order/status data is checked before review, and the backend remains authoritative for transitions. See [management workspace](management-orders.ar.md).

## تحديث دورة الطلب الداخلي والخارجي — 19 سبتمبر 2026

أضيف `PUT orders/{id}` لتعديل العميل وقائمة العناصر الكاملة واللون، وجرى إتاحة التعديل وتغيير الحالة في واجهة الأدوار الأربعة حسب توجيه صاحب المشروع. قبل POST/PUT يعاد التحقق من `orders/{id}` و`delivery-areas` و`orders/statuses`. `isInternalDelivery` مطلوب لتحديد الداخلي/الخارجي؛ غيابه يقفل الكتابة ولا يُفسّر على أنه داخلي. الخارجي يقبل التأكيد أو التعثر من Processing وحل التعثر إلى Processing بملاحظة فقط، وتعديل بياناته مقفل. تفاصيل القواعد، payloads، وحدود صلاحيات الخادم في [تقرير دورة الطلب](order-workflow.ar.md).

## شاشة المرتجع الخارجي — 6 أكتوبر 2026

المسار `management-employee/external-return?id={orderId}` مخصص للإداري دون شرط الإسناد. الشاشة تجدد تفاصيل الطلب وحالة زحل عند الدخول وقبل `POST orders/{id}/olivery-returns`. الجسم يحتوي `items: [{ orderItemId, quantity }]` فقط. لا تُنشئ طلب Return ولا ترسل تغييرًا لحالة الطلب الأصلية.

تُشترط شحنة خارجية وحالة زحل `delivered_with_return` وعدم وجود مرتجع سابق. غياب `isReturnProcessed` لا يمنع المحاولة الأولى؛ بعد نتيجة اتصال غير مؤكدة يبقى الإرسال محظورًا حتى تأكيد الخادم للمعالجة أو رجوع `isReturnProcessed: false` صراحة عند التحقق. تُحفظ المحاولة محليًا قبل POST حسب الخادم والمستخدم والدور والطلب. هذا حاجز في الواجهة وليس بديلًا عن منع التكرار الذري في الخادم.

`isCredited: false` يمنع المعالجة بعد المزامنة؛ غياب الحقل يبقي القرار النهائي للخادم. إعادة المخزون تُعرض فقط بحسب `isStockDecremented`. تقديرات التسوية تعتمد ربح البند المحفوظ مقسومًا على كميته الأصلية، مضروبًا في الكمية المرتجعة؛ البيانات الغائبة لا تتحول إلى صفر. شرط تسوية التاجر وجود userId وtotalMerchantProfitUSD.

على الخادم إجراء تحديث زحل الحقيقي والتحقق من الحالة والرصيد والكميات والتكرار وتطبيق المخزون والتسويات والسجل داخل معاملة ذرية. التطبيق لم يغيّر الباك إند، والاختبارات تستخدم استجابات وهمية دون تنفيذ تسويات حقيقية.

## كتالوج زحل وعناوينه العربية

تُوحّد عناوين المزود الـ27 وأسماؤها التقنية لأغراض العرض والفلاتر والأهلية فقط، مع دعم `printing_waiting` الإضافية مستقلة عن `waiting_printed`. تحتفظ الاستجابة بقيم `oliveryStatus` و`deliveryStatus` و`status` الأصلية؛ لا يُشتق DeliveryStatus من حالة زحل في الهاتف، وغيابه لا يُعامل كفشل تحميل. الحالات الجديدة محايدة ولا تمنح صلاحيات.

زر تحديث زحل يطلب المزامنة من الخادم ويجدد Orders/Products/Profile، ولا يرسل أمر انتقال يدوي للحالة الخام. الآثار المالية والمخزنية مسؤولية RefreshOliveryStatusesAsync ودوال Apply* في الباك إند، وليست صلاحيات أدوار أو عمليات ينفذها الهاتف. قائمة DeliveryStatus المسموحة مستقلة عن الآثار الجانبية. لا يتغير Order.Status تلقائيًا داخل التطبيق لتطابق حالة الشحنة.

تعرض بطاقة المتابعة تأكيد إضافة الأرصدة أو خصم الرسوم أو إعادة المخزون فقط عند وصول `isCredited` / `isFeeDebited` / `isRestocked` بقيمة true. الحالات `paid` و`money_in` و`completed` وحدها لا تثبت تغيير الرصيد. وقت آخر تحديث يخص نجاح طلب المزامنة في هذه الشاشة، وليس وقت تغيير الحالة لدى المزود. لم تتم مراجعة تنفيذ الباك إند أو تعديله ضمن هذه المهمة.
