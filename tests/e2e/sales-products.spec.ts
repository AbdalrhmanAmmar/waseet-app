import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const image = readFileSync('assets/images/brand-logo.png');
// Product/all as the backend may still send it: cost, merchant price and the applied
// price are present on purpose, to prove that sales never sees anything but expectedSellPrice.
const PRODUCTS = [
  {
    productCode: 185208,
    name: 'حقيبة يومية',
    categoryName: 'حقائب',
    quantity: 12,
    originalPrice: 50,
    merchantSellPrice: 9876,
    expectedSellPrice: 65,
    effectiveExpectedSellPrice: null,
    imageUrl: 'http://127.0.0.1:4173/media/bag.png',
    videoUrl: 'http://127.0.0.1:4173/media/bag.webm',
    description: 'حقيبة عملية للاستخدام اليومي.',
  },
  {
    productCode: 267661,
    name: 'Mouse',
    categoryName: 'إلكترونيات',
    quantity: 4,
    originalPrice: 10,
    merchantSellPrice: 9876,
    expectedSellPrice: 17,
    effectiveExpectedSellPrice: 20,
    imageUrl: 'http://127.0.0.1:4173/media/bag.png',
  },
  {
    productCode: 281531,
    name: 'بدون سعر مقترح',
    categoryName: 'حقائب',
    quantity: 3,
    originalPrice: 0,
    merchantSellPrice: 9876,
    expectedSellPrice: null,
    effectiveExpectedSellPrice: null,
  },
];
// Whole amounts only: totals such as 2,150.00 must not count as the 50.00 cost price.
const HIDDEN = /سعر التاجر|سعرك كتاجر|9,876|السعر الأصلي|(?<![\d,])(50|20)\.00 USD/;
async function setup(page: Page, failure = 0) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = {
    failure,
    removed: false,
    posts: [] as Record<string, unknown>[],
    calls: [] as string[],
    reject: false,
  };
  await page.route('**/media/bag.png', (route) =>
    route.fulfill({ body: image, contentType: 'image/png' }),
  );
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
    else if (path === 'Product/all') {
      expect(request.headers().authorization).toBe('Bearer sales-session');
      if (state.failure)
        return route.fulfill({ status: state.failure, json: { message: 'Forbidden' } });
      data = { items: PRODUCTS, page: 1, totalPages: 1, totalCount: PRODUCTS.length };
    } else if (path.startsWith('Product/')) {
      const code = Number(path.split('/')[1]);
      if (state.removed && code === 185208)
        return route.fulfill({ status: 404, json: { message: 'Not found' } });
      data = PRODUCTS.find((item) => item.productCode === code);
    } else if (path === 'delivery-areas')
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

test('sales browses Product/all with images and the expected price only, at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const state = await setup(page);
  await expect(page.getByRole('heading', { name: 'المنتجات', exact: true })).toBeVisible();
  const card = page.getByTestId('catalog-product-185208');
  await expect(card.getByText('سعر البيع المتوقع', { exact: true })).toBeVisible();
  await expect(card).toContainText('65.00');
  // The applied price (20) is not shown: Mouse shows its expected price (17).
  await expect(page.getByTestId('catalog-product-267661')).toContainText('17.00');
  await expect(page.getByText(HIDDEN)).toHaveCount(0);
  // Photo rendered (not the "no image" fallback).
  await expect(card.getByText('الصورة غير متاحة', { exact: true })).toHaveCount(0);
  expect(state.calls).toContain('Product/all');
  expect(state.calls).not.toContain('Product/order-options');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: 'test-results/sales-products-320.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByLabel('البحث عن المنتجات', { exact: true }).fill('٢٦٧٦٦١');
  await expect(page.getByTestId('catalog-product-267661')).toBeVisible();
  await expect(page.getByTestId('catalog-product-185208')).toHaveCount(0);
});

test('sales opens product details with photo, video and the expected price only', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 950 });
  const state = await setup(page);
  await page.getByRole('button', { name: 'تفاصيل حقيبة يومية', exact: true }).click();
  await expect(page).toHaveURL(/\/sales-employee\/product/);
  await expect(page.getByRole('heading', { name: 'حقيبة يومية', exact: true })).toBeVisible();
  await expect(page.locator('text=سعر البيع المتوقع >> visible=true').first()).toBeVisible();
  await expect(page.getByTestId('detail-suggested-price')).toHaveText('65.00 USD');
  await expect(page.getByTestId('detail-merchant-price')).toHaveCount(0);
  await expect(page.getByText(HIDDEN)).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'الصورة', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: /الفيديو/ })).toBeVisible();
  expect(state.calls).toContain('Product/185208');
  await page.screenshot({
    path: 'test-results/sales-product-details.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }).click();
  await expect(page).toHaveURL(/\/sales-employee\/create-order/);
  await expect(page.getByLabel('سعر بيع حقيبة يومية (USD)', { exact: true })).toHaveValue('65');
});

test('sales multi-product order revalidates through Product/{id} and keeps edits on rejection', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const state = await setup(page);
  await page.getByRole('button', { name: 'إنشاء طلب حقيبة يومية', exact: true }).click();
  await customer(page);
  await expect(page.getByLabel('سعر بيع حقيبة يومية (USD)', { exact: true })).toHaveValue('65');
  await page.getByLabel('كمية حقيبة يومية', { exact: true }).fill('30');
  await page.getByLabel('سعر بيع حقيبة يومية (USD)', { exact: true }).fill('71');
  await page.getByLabel('لون حقيبة يومية *', { exact: true }).fill('أسود');
  await page.getByRole('button', { name: 'إضافة منتج', exact: true }).click();
  await expect(page.getByText(/سعر البيع المتوقع: 17\.00 USD/)).toBeVisible();
  await page.getByRole('button', { name: 'اختيار بدون سعر مقترح', exact: true }).click();
  await expect(page.getByLabel('سعر بيع بدون سعر مقترح (USD)', { exact: true })).toHaveValue('');
  await page.getByLabel('سعر بيع بدون سعر مقترح (USD)', { exact: true }).fill('15');
  await page.getByLabel('لون بدون سعر مقترح *', { exact: true }).fill('أبيض');
  await expect(page.getByText(HIDDEN)).toHaveCount(0);
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true })).toBeVisible();
  expect(state.calls).toContain('Product/185208');
  expect(state.calls).toContain('Product/281531');
  expect(state.calls).not.toContain('Product/order-options');
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
  expect(errors).toEqual([]);
});

test('a product removed before review blocks submission without discarding the draft', async ({
  page,
}) => {
  const state = await setup(page);
  await page.getByRole('button', { name: 'إنشاء طلب حقيبة يومية', exact: true }).click();
  await customer(page);
  await page.getByLabel('لون حقيبة يومية *', { exact: true }).fill('أزرق');
  state.removed = true;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByLabel('لون حقيبة يومية *', { exact: true })).toHaveValue('أزرق');
  expect(state.posts).toHaveLength(0);
});

test('a forbidden catalog shows an honest retry state and recovers', async ({ page }) => {
  const state = await setup(page, 403);
  await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.getByTestId('catalog-product-185208')).toHaveCount(0);
  state.failure = 0;
  await page
    .getByRole('button', { name: /إعادة المحاولة/ })
    .first()
    .click();
  await expect(page.getByTestId('catalog-product-185208')).toBeVisible();
});
