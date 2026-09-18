import { test, expect, type Page } from '@playwright/test';
const paths = {
  Merchant: 'merchant',
  SalesEmployee: 'sales-employee',
  ManagementEmployee: 'management-employee',
  DeliveryAgent: 'delivery-agent',
} as const;
async function mockApi(page: Page, role: keyof typeof paths, status = 'Approved') {
  const calls: string[] = [];
  const user = {
    userId: 7,
    role,
    firstName: 'حساب',
    lastName: 'اختبار',
    email: 'test@example.com',
    accountStatus: status,
  };
  const order = {
    orderId: 21,
    status: 'Processing',
    customerName: 'عميل اختبار',
    orderTotalUSD: 15,
    items: [],
    createdAt: '2026-09-18T10:00:00Z',
  };
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/api/')[1];
    calls.push(path);
    let data: unknown = [];
    if (path === 'Auth/login') data = { user, token: 'test-session' };
    else if (path === 'User/7') data = user;
    else if (path === 'Product/8')
      data = { productCode: 8, name: 'منتج اختبار', price: 15, quantity: 4 };
    else if (path === 'Product/8/merchant-price/7')
      return route.fulfill({ status: 404, json: { message: 'No override' } });
    else if (path === 'Product/all')
      data = {
        items: [{ productCode: 8, name: 'منتج اختبار', price: 15, quantity: 4 }],
        page: 1,
        totalPages: 1,
        totalCount: 1,
      };
    else if (path === 'orders' || path === 'orders/my-deliveries')
      data = { items: [order], page: 1, totalPages: 1, totalCount: 1 };
    else if (path === 'orders/21') data = order;
    await route.fulfill({
      json: { isSuccess: true, data },
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  return calls;
}
async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
}
for (const role of Object.keys(paths) as (keyof typeof paths)[]) {
  test(`${role}: sign-in, correct role home, and order details`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const calls = await mockApi(page, role);
    await login(page);
    await expect(page).toHaveURL(new RegExp(`/${paths[role]}$`));
    if (role === 'Merchant' || role === 'SalesEmployee') {
      await expect(page.getByRole('heading', { name: 'نظرة على حسابك' })).toBeVisible();
      await page.screenshot({
        path: `test-results/${role}-home.png`,
        fullPage: true,
        animations: 'disabled',
      });
      await page.getByRole('tab', { name: /الطلبات/ }).click();
    }
    await page.getByRole('button', { name: 'فتح طلب #21', exact: true }).click();
    await expect(page.getByText('العميل: عميل اختبار')).toBeVisible();
    if (role === 'DeliveryAgent') {
      expect(calls).toContain('orders/my-deliveries');
      expect(calls).not.toContain('Product/all');
    }
    await page.screenshot({
      path: `test-results/${role}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    expect(errors).toEqual([]);
  });
}
test('pending account sees status only; protected deep links return to status', async ({
  page,
}) => {
  await mockApi(page, 'Merchant', 'Pending');
  await login(page);
  await expect(page).toHaveURL(/\/account-status$/);
  await expect(page.getByText('تحديث حالة الحساب', { exact: true })).toBeVisible();
  // Client-side URL navigation retains the in-memory web session.
  await page.evaluate(() => {
    window.history.pushState({}, '', '/merchant');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByText('تحديث حالة الحساب', { exact: true })).toBeVisible();
});
test('unauthenticated role deep link cannot show protected content', async ({ page }) => {
  await page.goto('/delivery-agent/order?id=21');
  await expect(page).toHaveURL(/\/(onboarding|login)$/);
  await expect(page.getByText('العميل: عميل اختبار')).toHaveCount(0);
});

test('merchant cannot open another role workspace', async ({ page }) => {
  await mockApi(page, 'Merchant');
  await login(page);
  await expect(page).toHaveURL(/\/merchant$/);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/delivery-agent/order?id=21');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).not.toHaveURL(/\/delivery-agent/);
  await expect(page.getByText('العميل: عميل اختبار')).toHaveCount(0);
});
test('undocumented password reset shows availability without making a request', async ({
  page,
}) => {
  const calls = await mockApi(page, 'Merchant');
  await page.goto('/forgot-password');
  await expect(
    page.getByText(
      'استعادة كلمة المرور غير متاحة حاليًا. تواصل مع الإدارة للمساعدة في استعادة حسابك.',
    ),
  ).toBeVisible();
  expect(calls).toEqual([]);
});
test('merchant browses product details and profile without losing the session', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockApi(page, 'Merchant');
  await login(page);
  await expect(page).toHaveURL(/\/merchant$/);
  await page.getByRole('tab', { name: /المنتجات/ }).click();
  await page.getByRole('button', { name: 'تفاصيل منتج اختبار', exact: true }).click();
  await expect(page.getByText('عن المنتج', { exact: true })).toBeVisible();
  await page.screenshot({
    path: 'test-results/product-details.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('tab', { name: /حسابي/ }).click();
  await expect(page.getByRole('button', { name: 'تعديل الملف الشخصي', exact: true })).toBeVisible();
  await page.screenshot({
    path: 'test-results/profile.png',
    fullPage: true,
    animations: 'disabled',
  });
  expect(errors).toEqual([]);
});
