# لقطات بمقاس App Store — iPhone 6.5 بوصة

ست صور PNG بمقاس 1242 × 2688 بكسل. التقطت الواجهات مباشرة بمساحة عرض 414 × 896 ومعامل دقة 3، دون تمديد الصور القديمة أو قصّها.

الترتيب المقترح:

1. `01-merchant-home.png` — الرئيسية للتاجر.
2. `02-sales-products.png` — منتجات المبيعات.
3. `03-create-order.png` — مراجعة الطلب قبل إنشائه.
4. `04-management-orders.png` — طلبات الإدارة.
5. `05-delivery-orders.png` — طلبات التوصيل.
6. `06-login.png` — تسجيل الدخول.

المصدر هو نسخة Expo Web الحالية، ببيانات توضيحية محلية، وليس جهاز iPhone أو محاكي iOS. المقاس مطابق للخانة المطلوبة، لكن يجب مطابقة المظهر مع بناء iOS النهائي قبل نشر الصور. لا تحتوي الصور على بيانات حسابات أو عملاء حقيقيين، ولم تُرسل طلبات إلى خادم الإنتاج.

ارفع ملفات PNG منفردة في خانة Screenshots. ملف ZIP المجاور للتنزيل وفك الضغط فقط. لم تُنشأ فيديوهات App Previews.

لإعادة الالتقاط من جذر المشروع:

```sh
npx expo export --platform web --output-dir /tmp/waseet-store-preview
node scripts/capture-store-screenshots.mjs /tmp/waseet-store-preview iphone
```

يتحقق السكربت من أبعاد كل ملف وحجمه ومن غياب أخطاء JavaScript ورسائل الخطأ الظاهرة.
