import { test, expect, type Page } from '@playwright/test';
const items = [
  {
    productCode: 'WS-104',
    name: 'سماعات لاسلكية',
    expectedSellPrice: 35,
    merchantSellPrice: 25,
    quantity: 2,
    category: 'إلكترونيات',
  },
  {
    productCode: 'WS-208',
    name: 'غلاية كهربائية',
    expectedSellPrice: 28,
    merchantSellPrice: 20,
    quantity: 4,
    category: 'المنزل',
  },
  { productCode: 'WS-316', name: 'خلاط محمول', price: 22, quantity: 8, category: 'المنزل' },
  { productCode: 'WS-420', name: 'ساعة ذكية', price: 45, quantity: 0, category: 'إلكترونيات' },
];
async function setup(
  page: Page,
  role = 'Merchant',
  options: { failNext?: boolean; empty?: boolean; failAll?: boolean; priceListId?: number } = {},
) {
  let failNext = !!options.failNext;
  let failAll = !!options.failAll;
  const calls: number[] = [];
  const paths: string[] = [];
  const user = {
    userId: 7,
    firstName: 'أحمد',
    role,
    accountStatus: 'Approved',
    priceListId: options.priceListId,
  };
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/api/')[1];
    paths.push(path);
    if (path.startsWith('price-lists'))
      return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
    if (path === 'Auth/login') return route.fulfill({ json: { data: { user, token: 'test' } } });
    if (path === 'User/7') return route.fulfill({ json: { data: user } });
    if (path.startsWith('Product/') && path.includes('/merchant-price/'))
      return route.fulfill({ status: 404, json: { message: 'No override' } });
    if (path.startsWith('Product/') && path !== 'Product/all')
      return route.fulfill({
        json: { data: items.find((item) => item.productCode === path.split('/')[1]) },
      });
    if (path === 'Product/all') {
      const current = Number(url.searchParams.get('page') || 1);
      calls.push(current);
      if (failAll || (current === 2 && failNext))
        return route.fulfill({ status: 503, json: { message: 'offline' } });
      return route.fulfill({
        json: {
          data: {
            items: options.empty ? [] : current === 1 ? items.slice(0, 2) : items.slice(2),
            page: current,
            totalPages: options.empty ? 1 : 2,
            totalCount: options.empty ? 0 : 4,
          },
        },
      });
    }
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await page.getByRole('tab', { name: /المنتجات/ }).click();
  await expect(page.getByRole('heading', { name: 'اكتشف منتجاتك' })).toBeVisible();
  return {
    calls,
    paths,
    recover: () => {
      failNext = false;
      failAll = false;
    },
  };
}
test('catalog loads all pages, changes quantities within stock and opens cart', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 1100 });
  const api = await setup(page);
  await expect(page.getByText('4 نتيجة', { exact: true })).toBeVisible();
  expect(api.calls).toContain(2);
  const card = page.getByTestId('catalog-product-WS-104');
  await card.getByRole('button', { name: 'إضافة سماعات لاسلكية للسلة' }).click();
  await card.getByRole('button', { name: 'زيادة كمية سماعات لاسلكية' }).click();
  await expect(card.getByRole('button', { name: 'زيادة كمية سماعات لاسلكية' })).toBeDisabled();
  await card.getByRole('button', { name: 'تقليل كمية سماعات لاسلكية' }).click();
  await page
    .getByTestId('catalog-product-WS-208')
    .getByRole('button', { name: 'إضافة غلاية كهربائية للسلة' })
    .click();
  await page
    .getByTestId('catalog-product-WS-208')
    .getByRole('button', { name: 'زيادة كمية غلاية كهربائية' })
    .click();
  await expect(page.getByRole('button', { name: 'إضافة ساعة ذكية للسلة' })).toBeDisabled();
  await page.getByRole('heading', { name: 'اكتشف منتجاتك' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/catalog-grid.png', fullPage: true });
  await page.getByRole('button', { name: 'عرض السلة، 3 قطعة', exact: true }).click();
  await expect(page).toHaveURL(/\/merchant\/cart/);
  expect(errors).toEqual([]);
});
test('merchant catalog uses Product/all prices even when the account has a price list', async ({
  page,
}) => {
  const api = await setup(page, 'Merchant', { priceListId: 9 });
  await expect(page.getByText('4 نتيجة', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const card = page.getByTestId('catalog-product-WS-104');
  await expect(card).toContainText('35 USD');
  await expect(card).toContainText('25 USD');
  expect(api.calls).toEqual([1, 2]);
  expect(
    api.paths.filter((path) => path.startsWith('Product/') || path.startsWith('price-lists')),
  ).toEqual(['Product/all', 'Product/all']);
  await page.getByRole('tab', { name: /الرئيسية/ }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(api.paths.some((path) => path.startsWith('price-lists'))).toBe(false);
});
test('search finds later pages by code; filter draft validates, cancels and applies; list preference persists', async ({
  page,
}) => {
  await setup(page);
  await expect(page.getByText('4 نتيجة', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'البحث عن المنتجات' }).fill('ws-316');
  await expect(page.getByTestId('catalog-product-WS-316')).toBeVisible();
  await expect(page.getByTestId('catalog-product-WS-104')).toHaveCount(0);
  await page.getByRole('button', { name: 'مسح البحث', exact: true }).click();
  await page.getByRole('button', { name: /تصفية وترتيب/ }).click();
  await page.getByRole('textbox', { name: 'السعر الأدنى' }).fill('100');
  await page.getByRole('textbox', { name: 'السعر الأعلى' }).fill('10');
  await page.getByRole('button', { name: 'تطبيق الفلاتر' }).click();
  await expect(page.getByRole('alert')).toContainText('السعر الأدنى');
  await page.getByRole('button', { name: 'مسح الفلاتر', exact: true }).click();
  await page.getByRole('textbox', { name: 'السعر الأعلى' }).fill('٣٠');
  await page.getByRole('radio', { name: 'الأقل سعرًا', exact: true }).click();
  await page.screenshot({ path: 'test-results/catalog-filters.png', fullPage: true });
  await page.getByRole('button', { name: 'تطبيق الفلاتر' }).click();
  await expect(page.getByText('2 نتيجة', { exact: true })).toBeVisible();
  await expect(page.getByTestId('catalog-product-WS-104')).toHaveCount(0);
  await page.getByRole('button', { name: /تصفية وترتيب/ }).click();
  await page.getByRole('button', { name: 'مسح الفلاتر', exact: true }).click();
  await page.getByRole('button', { name: 'إغلاق', exact: true }).click();
  await expect(page.getByText('2 نتيجة', { exact: true })).toBeVisible();
  while (await page.getByRole('button', { name: /إزالة فلتر/ }).count())
    await page
      .getByRole('button', { name: /إزالة فلتر/ })
      .first()
      .click();
  await page.getByRole('radio', { name: 'عرض قائمة', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('waseet.catalog.view')))
    .toBe('list');
  await page.screenshot({ path: 'test-results/catalog-list.png', fullPage: true });
  await page.getByRole('button', { name: 'تفاصيل سماعات لاسلكية', exact: true }).click();
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'عرض قائمة', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('textbox', { name: 'البحث عن المنتجات' }).fill('not-existing');
  await expect(page.getByText('لا توجد نتائج مطابقة', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'مسح البحث والفلاتر' }).click();
  await expect(page.getByText('4 نتيجة', { exact: true })).toBeVisible();
});
test('partial page errors remain honest, stop automatic retries and recover on request', async ({
  page,
}) => {
  const api = await setup(page, 'Merchant', { failNext: true });
  await expect(page.getByRole('alert')).toContainText('تعذر تحميل بقية المنتجات');
  await expect(page.getByRole('alert')).toContainText('503');
  await expect(page.getByText('2 نتيجة ضمن 2 منتج محمّل', { exact: true })).toBeVisible();
  expect(api.calls.filter((n) => n === 2)).toHaveLength(1);
  await page.getByRole('textbox', { name: 'البحث عن المنتجات' }).fill('WS-316');
  await expect(
    page.getByRole('heading', { name: 'لا توجد نتائج ضمن المنتجات المحمّلة' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'مسح البحث', exact: true }).click();
  api.recover();
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(page.getByText('4 نتيجة', { exact: true })).toBeVisible();
  expect(api.calls.filter((n) => n === 1)).toHaveLength(1);
  expect(api.calls.filter((n) => n === 2)).toHaveLength(2);
});
test('sales catalog works at 320px without merchant prices; availability and zero quantity work', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await setup(page, 'SalesEmployee');
  await expect(page.getByText('4 نتيجة', { exact: true })).toBeVisible();
  await expect(page.getByText('سعر التاجر', { exact: true })).toHaveCount(0);
  const card = page.getByTestId('catalog-product-WS-104');
  await card.getByRole('button', { name: 'إضافة سماعات لاسلكية للسلة' }).click();
  await card.getByRole('button', { name: 'تقليل كمية سماعات لاسلكية' }).click();
  await expect(page.getByRole('button', { name: /^عرض السلة،/ })).toHaveCount(0);
  await page.getByRole('button', { name: /تصفية وترتيب/ }).click();
  await page.getByRole('switch', { name: 'المتوفر فقط' }).click();
  await page.getByRole('button', { name: 'تطبيق الفلاتر' }).click();
  await expect(page.getByText('3 نتيجة', { exact: true })).toBeVisible();
  await expect(page.getByTestId('catalog-product-WS-420')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('empty catalog and initial failure have distinct states', async ({ page }) => {
  const api = await setup(page, 'Merchant', { empty: true, failAll: true });
  await expect(page.getByRole('alert')).toHaveText('تعذر تحميل المنتجات');
  await expect(page.getByText('لا توجد نتائج مطابقة', { exact: true })).toHaveCount(0);
  api.recover();
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'لا توجد منتجات حاليًا', exact: true }),
  ).toBeVisible();
});
