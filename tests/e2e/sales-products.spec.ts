import { test, expect, type Page } from '@playwright/test';
async function setup(page: Page, failure = 0) {
  const state = {
    failure,
    removed: false,
    malformed: false,
    posts: [] as Record<string, unknown>[],
    calls: [] as string[],
    reject: false,
    options: [
      {
        productCode: 185208,
        name: 'حقيبة يومية',
        originalPrice: 50,
        expectedSellPrice: 65,
        merchantSellPrice: 9876,
        effectiveExpectedSellPrice: null,
      },
      {
        productCode: 267661,
        name: 'Mouse',
        originalPrice: 10,
        expectedSellPrice: 17,
        merchantSellPrice: 9876,
        effectiveExpectedSellPrice: 20,
      },
      {
        productCode: 281531,
        name: 'بدون سعر مقترح',
        originalPrice: 0,
        expectedSellPrice: null,
        merchantSellPrice: 9876,
        effectiveExpectedSellPrice: null,
      },
    ],
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.split('/api/')[1];
    state.calls.push(path);
    let data: unknown = [];
    if (path === 'Auth/login')
      data = {
        user: { userId: 7, role: 'sales', accountStatus: 'Approved' },
        token: 'sales-session',
      };
    else if (path === 'Product/order-options') {
      expect(request.headers().authorization).toBe('Bearer sales-session');
      expect(url.search).toBe('');
      if (state.failure)
        return route.fulfill({ status: state.failure, json: { message: 'Forbidden' } });
      data = state.malformed ? {} : state.removed ? state.options.slice(1) : state.options;
    } else if (path.startsWith('Product/'))
      return route.fulfill({ status: 403, json: { message: 'Forbidden catalog' } });
    else if (path === 'delivery-areas')
      data = [{ deliveryAreaId: 1, isInternalDelivery: false, city: 'دمشق', fee: 5 }];
    else if (path === 'orders' && request.method() === 'POST') {
      state.posts.push(request.postDataJSON());
      if (state.reject)
        return route.fulfill({ status: 400, json: { message: 'الكمية المطلوبة تتجاوز المخزون' } });
      data = { orderId: 21 };
    } else if (path === 'orders') data = { items: [], page: 1, totalPages: 1, totalCount: 0 };
    await route.fulfill({ json: { isSuccess: true, data } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('sales@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(/\/sales-employee$/);
  await page.getByRole('tab', { name: /المنتجات/ }).click();
  return state;
}
async function customer(page: Page) {
  await page.getByLabel('اسم العميل *', { exact: true }).fill('عميل مبيعات');
  await page.getByRole('button', { name: 'اختيار منطقة التوصيل', exact: true }).click();
  await page.getByRole('button', { name: 'اختيار دمشق', exact: true }).click();
  await page.getByLabel('رقم الهاتف السوري *', { exact: true }).fill('٠٩١٢٣٤٥٦٧٨');
  await page.getByLabel('العنوان التفصيلي *', { exact: true }).fill('شارع النصر');
}
function onlySalesProducts(calls: string[]) {
  expect(
    calls.filter((path) => path.startsWith('Product/') && path !== 'Product/order-options'),
  ).toEqual([]);
}
test('sales shows contract prices only, searches Arabic codes and blocks direct product details at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  const state = await setup(page);
  const card = page.getByTestId('sales-product-185208');
  await expect(card.getByText('50.00 USD', { exact: true })).toBeVisible();
  await expect(card.getByText('65.00 USD', { exact: true })).toBeVisible();
  await expect(page.getByText(/سعر التاجر|9,876|نفدت الكمية|متاح .* قطعة/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /تفاصيل/ })).toHaveCount(0);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: 'test-results/sales-products-320.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByLabel('البحث في منتجات المبيعات').fill('٢٦٧٦٦١');
  await expect(page.getByText('1 منتج من 3', { exact: true })).toBeVisible();
  await expect(
    page.getByTestId('sales-product-267661').getByText('20.00 USD', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'مسح البحث', exact: true }).click();
  await page.evaluate(() => {
    window.history.pushState({}, '', '/sales-employee/product?id=185208');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL(/\/sales-employee\/products$/);
  await expect(page.getByRole('heading', { name: 'منتجات لطلبك القادم' })).toBeVisible();
  onlySalesProducts(state.calls);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('sales seeded multi-product order retains edited values and server rejection; no stock/details fetches', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const state = await setup(page);
  await expect(page.getByTestId('sales-product-185208')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: 'test-results/sales-products.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'إنشاء طلب حقيبة يومية', exact: true }).click();
  await customer(page);
  await expect(page.getByLabel('سعر بيع حقيبة يومية (USD)', { exact: true })).toHaveValue('65');
  await page.getByRole('button', { name: 'زيادة كمية حقيبة يومية', exact: true }).click();
  await expect(page.getByLabel('كمية حقيبة يومية', { exact: true })).toHaveValue('2');
  await page.getByLabel('كمية حقيبة يومية', { exact: true }).fill('30');
  await page.getByLabel('سعر بيع حقيبة يومية (USD)', { exact: true }).fill('71');
  await page.getByLabel('لون حقيبة يومية *', { exact: true }).fill('أسود');
  await page.getByRole('button', { name: 'إضافة منتج', exact: true }).click();
  await page.getByRole('button', { name: 'اختيار بدون سعر مقترح', exact: true }).click();
  await expect(page.getByLabel('سعر بيع بدون سعر مقترح (USD)', { exact: true })).toHaveValue('');
  await page.getByLabel('سعر بيع بدون سعر مقترح (USD)', { exact: true }).fill('15');
  await page.getByLabel('لون بدون سعر مقترح *', { exact: true }).fill('أبيض');
  await expect(page.getByText(/سعر التاجر|9,876|متاح .* قطعة/)).toHaveCount(0);
  const count = state.calls.filter((path) => path === 'Product/order-options').length;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true })).toBeVisible();
  expect(state.calls.filter((path) => path === 'Product/order-options')).toHaveLength(count + 1);
  expect(state.posts).toHaveLength(0);
  state.reject = true;
  await page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }).click();
  await expect(page.getByText('الكمية المطلوبة تتجاوز المخزون', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'تعديل البيانات', exact: true }).click();
  await expect(page.getByLabel('لون حقيبة يومية *', { exact: true })).toHaveValue('أسود');
  await expect(page.getByLabel('سعر بيع حقيبة يومية (USD)', { exact: true })).toHaveValue('71');
  state.reject = false;
  await page.getByLabel('كمية حقيبة يومية', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }).click();
  await expect(page.getByText('تم إنشاء الطلب بنجاح', { exact: true })).toBeVisible();
  expect(state.posts[1].items).toEqual([
    { productCode: 185208, quantity: 2, actualSellPriceUSD: 71, color: 'أسود' },
    { productCode: 281531, quantity: 1, actualSellPriceUSD: 15, color: 'أبيض' },
  ]);
  onlySalesProducts(state.calls);
  expect(errors).toEqual([]);
});
test('removed option prevents review without discarding the draft', async ({ page }) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'إنشاء طلب حقيبة يومية', exact: true }).click();
  await customer(page);
  await page.getByLabel('لون حقيبة يومية *', { exact: true }).fill('أزرق');
  state.removed = true;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(page.getByText(/لم يعد ضمن خيارات الطلب/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByLabel('لون حقيبة يومية *', { exact: true })).toHaveValue('أزرق');
  expect(state.posts).toHaveLength(0);
  onlySalesProducts(state.calls);
});
test('403, malformed responses and an empty options list have honest retry states without fallback', async ({
  page,
}) => {
  const state = await setup(page, 403);
  await expect(page.getByText(/حسابك لا يملك صلاحية عرض المنتجات/)).toBeVisible();
  await expect(page.getByText('لا توجد منتجات حاليًا', { exact: true })).toHaveCount(0);
  state.failure = 0;
  state.malformed = true;
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(
    page.getByText('استجابة الخادم لا تحتوي على بيانات منتجات صالحة.', { exact: true }),
  ).toBeVisible();
  state.malformed = false;
  state.options = [];
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(page.getByText('لا توجد منتجات حاليًا', { exact: true })).toBeVisible();
  onlySalesProducts(state.calls);
});
