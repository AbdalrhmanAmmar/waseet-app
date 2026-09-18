import { test, expect, type Page } from '@playwright/test';
async function setup(page: Page, role = 'Merchant') {
  const user = {
    userId: 7,
    role,
    firstName: 'أحمد',
    lastName: 'اختبار',
    email: 'test@example.com',
    accountStatus: 'Approved',
  };
  const products = [
    {
      productCode: 8,
      name: 'حقيبة يومية',
      quantity: 5,
      merchantSellPrice: 20,
      expectedSellPrice: 30,
    },
    {
      productCode: 9,
      name: 'ساعة كلاسيكية',
      quantity: 2,
      merchantSellPrice: 10,
      expectedSellPrice: 18,
    },
    { productCode: 10, name: 'منتج نافد', quantity: 0, expectedSellPrice: 10 },
  ];
  const state = {
    posts: [] as Record<string, any>[],
    calls: [] as string[],
    stock: 5,
    failure: 0,
    missingFee: false,
    delay: 0,
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split('/api/')[1];
    state.calls.push(path);
    let data: unknown = [];
    if (path === 'Auth/login') data = { user, token: 'test-session' };
    else if (path === 'User/7') data = user;
    else if (path === 'Product/all')
      data = { items: products, page: 1, totalPages: 1, totalCount: products.length };
    else if (path === 'Product/8') data = { ...products[0], quantity: state.stock };
    else if (path === 'Product/9') data = products[1];
    else if (path === 'delivery-areas')
      data = [
        { deliveryAreaId: 1, city: 'دمشق', fee: state.missingFee ? null : 5 },
        { deliveryAreaId: 2, city: 'حلب', fee: null },
      ];
    else if (path === 'orders' && request.method() === 'POST') {
      expect(request.headers().authorization).toBe('Bearer test-session');
      state.posts.push(request.postDataJSON());
      if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
      if (state.failure)
        return route.fulfill({ status: state.failure, json: { message: 'تعذر إنشاء الطلب الآن' } });
      data = { orderId: 21 };
    } else if (path === 'orders/21')
      data = {
        orderId: 21,
        customerName: 'سارة أحمد',
        status: 'Processing',
        orderTotalUSD: 70,
        items: [
          {
            productCode: 8,
            productName: 'حقيبة يومية',
            quantity: 2,
            actualSellPriceUSD: 32.5,
            color: 'أسود',
          },
        ],
      };
    else if (path === 'orders') data = { items: [], page: 1, totalPages: 1, totalCount: 0 };
    await route.fulfill({ json: { isSuccess: true, data } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('tab', { name: /طلب جديد/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /السلة/ })).toHaveCount(0);
  await page.getByRole('tab', { name: /طلب جديد/ }).click();
  await expect(page).toHaveURL(/\/create-order/);
  return state;
}
async function fill(page: Page) {
  await page.getByLabel('اسم العميل *', { exact: true }).fill('سارة أحمد');
  await page.getByLabel('رقم الهاتف السوري *', { exact: true }).fill('٠٩١٢٣٤٥٦٧٨');
  await page.getByRole('button', { name: 'اختيار منطقة التوصيل', exact: true }).click();
  await expect(page.getByRole('button', { name: 'اختيار حلب', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'اختيار دمشق', exact: true }).click();
  await page.getByLabel('العنوان التفصيلي *', { exact: true }).fill('شارع النصر، بجوار المكتبة');
  await page.getByRole('button', { name: 'إضافة منتج', exact: true }).click();
  await expect(page.getByRole('button', { name: 'اختيار منتج نافد', exact: true })).toBeDisabled();
  await page.getByLabel('البحث في المنتجات', { exact: true }).fill('٨');
  await page.getByRole('button', { name: 'اختيار حقيبة يومية', exact: true }).click();
  await page.getByLabel('كمية حقيبة يومية', { exact: true }).fill('٢');
  await page.getByLabel('سعر بيع حقيبة يومية (USD)', { exact: true }).fill('٣٢٫٥');
  await page.getByLabel('لون حقيبة يومية *', { exact: true }).fill('أسود');
}
for (const role of ['Merchant', 'SalesEmployee'])
  test(`${role}: direct order includes color, edited price, review, success and no cart`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const state = await setup(page, role);
    await fill(page);
    if (role === 'SalesEmployee') await expect(page.getByText(/فرق السعر المتوقع/)).toHaveCount(0);
    await page.getByRole('button', { name: 'إضافة منتج', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'اختيار حقيبة يومية', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'إغلاق الاختيار', exact: true }).click();
    await page.screenshot({ path: `test-results/${role}-create-order-items.png`, fullPage: true });
    await page.getByText('من التفاصيل إلى طلب جاهز', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/${role}-create-order.png`,
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/اللون: أسود/)).toBeVisible();
    expect(state.posts).toHaveLength(0);
    expect(
      state.calls.filter((p) => p.includes('merchant-price') || p.includes('price-lists')),
    ).toEqual([]);
    expect(state.calls).toContain('Product/8');
    // Wait for the React Native modal entrance animation before capturing the preview.
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/${role}-order-review.png`, fullPage: true });
    await page.getByRole('button', { name: 'تعديل البيانات', exact: true }).click();
    await expect(page.getByLabel('لون حقيبة يومية *', { exact: true })).toHaveValue('أسود');
    await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
    await page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }).click();
    await expect(page.getByText('تم إنشاء الطلب بنجاح', { exact: true })).toBeVisible();
    expect(state.posts).toEqual([
      {
        customerName: 'سارة أحمد',
        customerMobile: '0912345678',
        customerArea: 'دمشق',
        customerAddress: 'شارع النصر، بجوار المكتبة',
        items: [{ productCode: 8, quantity: 2, actualSellPriceUSD: 32.5, color: 'أسود' }],
      },
    ]);
    await page.getByRole('button', { name: 'عرض تفاصيل الطلب', exact: true }).click();
    await expect(page.getByText('اللون: أسود', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
test('color required, stock revalidated, form retained, and discard requires confirmation at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  const state = await setup(page);
  await fill(page);
  await page.getByLabel('لون حقيبة يومية *', { exact: true }).fill('');
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(page.getByText('لون المنتج مطلوب', { exact: true })).toBeVisible();
  await page.getByLabel('لون حقيبة يومية *', { exact: true }).fill('أزرق');
  state.stock = 1;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(
    page.getByText('الكمية المطلوبة غير متاحة في المخزون', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('لون حقيبة يومية *', { exact: true })).toHaveValue('أزرق');
  expect(state.posts).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('button', { name: 'متابعة كتابة الطلب', exact: true }).click();
  await expect(page.getByLabel('اسم العميل *', { exact: true })).toHaveValue('سارة أحمد');
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('button', { name: 'تجاهل البيانات والمغادرة', exact: true }).click();
  await expect(page).toHaveURL(/\/merchant$/);
  await page.getByRole('tab', { name: /طلب جديد/ }).click();
  await expect(page.getByLabel('اسم العميل *', { exact: true })).toHaveValue('');
});
test('known rejection keeps draft; ambiguous server failure blocks repeat submission', async ({
  page,
}) => {
  const state = await setup(page);
  await fill(page);
  state.failure = 400;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }).click();
  await expect(page.getByText('تعذر إنشاء الطلب الآن', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'تعديل البيانات', exact: true }).click();
  await expect(page.getByLabel('لون حقيبة يومية *', { exact: true })).toHaveValue('أسود');
  state.failure = 500;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }).click();
  await expect(page.getByText(/لم تصل نتيجة مؤكدة/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }),
  ).toBeDisabled();
  expect(state.posts).toHaveLength(2);
});
test('changed delivery fee cannot silently become free shipping', async ({ page }) => {
  const state = await setup(page);
  await fill(page);
  state.missingFee = true;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(page.getByText('رسوم هذه المنطقة غير متاحة حاليًا', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true })).toHaveCount(
    0,
  );
  expect(state.posts).toHaveLength(0);
});

test('multiple products retain separate colors and a double tap submits only once', async ({
  page,
}) => {
  const state = await setup(page);
  await fill(page);
  await page.getByRole('button', { name: 'إضافة منتج', exact: true }).click();
  await page.getByRole('button', { name: 'اختيار ساعة كلاسيكية', exact: true }).click();
  await page.getByLabel('لون ساعة كلاسيكية *', { exact: true }).fill('ذهبي');
  state.delay = 400;
  await page.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true }).dblclick();
  await expect(page.getByText('تم إنشاء الطلب بنجاح', { exact: true })).toBeVisible();
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0].items).toEqual([
    { productCode: 8, quantity: 2, actualSellPriceUSD: 32.5, color: 'أسود' },
    { productCode: 9, quantity: 1, actualSellPriceUSD: 18, color: 'ذهبي' },
  ]);
  await page.getByRole('button', { name: 'إنشاء طلب آخر', exact: true }).click();
  await expect(page.getByLabel('اسم العميل *', { exact: true })).toHaveValue('');
  await expect(page.getByTestId('order-item-8')).toHaveCount(0);
});
