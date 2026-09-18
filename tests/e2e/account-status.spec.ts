import { test, expect, type Page } from '@playwright/test';
const roles = {
  Merchant: 'merchant',
  SalesEmployee: 'sales-employee',
  ManagementEmployee: 'management-employee',
  DeliveryAgent: 'delivery-agent',
} as const;
async function setup(
  page: Page,
  role: keyof typeof roles = 'Merchant',
  initial = 'Pending',
  reason?: string,
) {
  let status = initial;
  let fail = false;
  let calls = 0;
  const user = () => ({
    userId: 7,
    firstName: 'أحمد',
    lastName: 'اختبار',
    email: 'test@example.com',
    role,
    accountStatus: status,
    rejectionReason: reason,
  });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.split('/api/')[1];
    if (path === 'Auth/login')
      return route.fulfill({
        json: { isSuccess: true, data: { user: user(), token: 'test-session' } },
      });
    if (path === 'User/7') {
      calls++;
      return route.fulfill({
        status: fail ? 503 : 200,
        json: fail ? { message: 'غير متاح' } : { isSuccess: true, data: user() },
      });
    }
    return route.fulfill({ json: { isSuccess: true, data: [] } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(/\/account-status$/);
  await expect.poll(() => calls).toBeGreaterThan(0);
  return {
    setStatus: (value: string) => {
      status = value;
    },
    setFail: (value: boolean) => {
      fail = value;
    },
    calls: () => calls,
    setReason: (value?: string) => {
      reason = value;
    },
  };
}

test('rejected screen shows actual reason, copies ID, handles support and refreshes to pending then approved', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 940 });
  const api = await setup(page, 'Merchant', 'Rejected', 'بيانات النشاط التجاري غير مكتملة.');
  await expect(page.getByTestId('rejected-account-screen')).toBeVisible();
  await expect(page.getByTestId('rejection-reason')).toContainText(
    'بيانات النشاط التجاري غير مكتملة.',
  );
  await expect(page.getByText('الخطوة التالية', { exact: true })).toBeVisible();
  await expect(page.getByText('إنشاء الحساب', { exact: true })).toHaveCount(0);
  await expect(page.getByText('تعديل البيانات وإعادة تقديم الطلب', { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/account-rejected.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'نسخ رقم الحساب', exact: true }).click();
  await expect(page.getByText('تم نسخ رقم الحساب', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('7');
  await page.getByRole('button', { name: 'تواصل مع الدعم', exact: true }).click();
  await expect(page.getByRole('link', { name: /واتساب/ })).toBeVisible();
  await page.getByRole('button', { name: 'إغلاق', exact: true }).click();
  api.setFail(true);
  await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  api.setFail(false);
  api.setReason(undefined);
  await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
  await expect(page.getByTestId('rejection-reason')).toHaveCount(0);
  api.setStatus('Pending');
  await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'حسابك قيد المراجعة', exact: true }),
  ).toBeVisible();
  api.setStatus('Approved');
  await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
  await expect(page).toHaveURL(/\/merchant$/);
});

test('rejected screen without a reason stays usable at 320px and logs out', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await setup(page, 'Merchant', 'Rejected', ' ');
  await expect(page.getByTestId('rejection-reason')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await expect(page).toHaveURL(/\/(login|onboarding)$/);
});

for (const status of [200, 401, 403]) {
  test(`rejected login ${status} retains optional review metadata without granting access`, async ({
    page,
  }) => {
    const protectedCalls: string[] = [];
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.split('/api/')[1];
      if (path === 'Auth/login')
        return route.fulfill({
          status,
          json: {
            isSuccess: false,
            message: status === 200 ? 'لم تتم الموافقة على حسابك' : 'Login unavailable',
            ...(status !== 200 && {
              data: {
                accountStatus: 'Rejected',
                rejectionReason: 'يرجى تصحيح بيانات النشاط.',
                userId: 42,
              },
            }),
          },
        });
      protectedCalls.push(path);
      return route.fulfill({ json: { data: [] } });
    });
    await page.goto('/login');
    await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'لم تتم الموافقة على حسابك', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('rejection-reason')).toHaveCount(status === 200 ? 0 : 1);
    await expect(page.getByRole('button', { name: 'نسخ رقم الحساب' })).toHaveCount(
      status === 200 ? 0 : 1,
    );
    await expect(page.getByRole('button', { name: 'تحديث حالة الحساب' })).toHaveCount(0);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    expect(protectedCalls).toEqual([]);
    await page.getByRole('button', { name: 'إعادة تسجيل الدخول', exact: true }).click();
    await expect(page.getByPlaceholder('أدخل بريدك الإلكتروني')).toHaveValue('test@example.com');
    await expect(page.getByPlaceholder('أدخل كلمة المرور')).toHaveValue('');
  });
}
for (const role of Object.keys(roles) as (keyof typeof roles)[]) {
  test(`${role}: pending account refresh activates its own workspace`, async ({ page }) => {
    const api = await setup(page, role);
    await expect(
      page.getByRole('heading', { name: 'حسابك قيد المراجعة', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('أهلًا أحمد، سعداء بانضمامك')).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    if (role === 'Merchant') {
      // Capture the initial design before refresh feedback changes its height.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: 'test-results/account-pending.png',
        fullPage: true,
        animations: 'disabled',
      });
    }
    await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
    await expect(page.getByText('تم تحديث حالة حسابك.', { exact: true })).toBeVisible();
    api.setStatus('Approved');
    await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${roles[role]}$`));
  });
}
test('pending screen handles offline retry, support and logout on a small phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const api = await setup(page);
  api.setFail(true);
  await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'تعذر تحديث حالة الحساب. تحقق من اتصالك وحاول مرة أخرى.',
  );
  api.setFail(false);
  await page.getByRole('button', { name: 'تحديث حالة الحساب', exact: true }).click();
  await expect(page.getByText('تم تحديث حالة حسابك.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'تواصل مع الدعم', exact: true }).click();
  await expect(page.getByRole('link', { name: /واتساب/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /اتصل بنا/ })).toBeVisible();
  await page.getByRole('button', { name: 'إغلاق', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'تسجيل الخروج', exact: true }).click();
  await expect(page).toHaveURL(/\/(login|onboarding)$/);
});
test('returning to the browser rechecks status and enters the activated workspace', async ({
  page,
}) => {
  const api = await setup(page);
  api.setStatus('Approved');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/\/merchant$/);
});
for (const [status, title] of [
  ['Rejected', 'لم تتم الموافقة على حسابك'],
  ['Suspended', 'حسابك موقوف حاليًا'],
  ['Disabled', 'حسابك غير مفعّل حاليًا'],
]) {
  test(`${status} shows its own explanation instead of pending approval`, async ({ page }) => {
    await setup(page, 'Merchant', status);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByText('حسابك قيد المراجعة', { exact: true })).toHaveCount(0);
  });
}

for (const status of [200, 401, 403]) {
  test(`login rejection ${status} opens the review screen without granting a session`, async ({
    page,
  }) => {
    let approved = false;
    const protectedCalls: string[] = [];
    const user = { userId: 7, role: 'Merchant', firstName: 'أحمد', accountStatus: 'Approved' };
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.split('/api/')[1];
      if (path === 'Auth/login')
        return route.fulfill(
          approved
            ? { json: { isSuccess: true, data: { user, token: 'test-session' } } }
            : { status, json: { isSuccess: false, message: 'Your account is pending approval.' } },
        );
      protectedCalls.push(path);
      return route.fulfill({ json: { isSuccess: true, data: path === 'User/7' ? user : [] } });
    });
    await page.goto('/login');
    await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'حسابك قيد المراجعة', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    expect(protectedCalls).toEqual([]);
    await page.getByRole('button', { name: 'تواصل مع الدعم', exact: true }).click();
    await expect(page.getByRole('link', { name: /واتساب/ })).toBeVisible();
    await page.getByRole('button', { name: 'إغلاق', exact: true }).click();
    await page.getByRole('button', { name: 'إعادة تسجيل الدخول', exact: true }).click();
    await expect(page.getByPlaceholder('أدخل بريدك الإلكتروني')).toHaveValue('test@example.com');
    await expect(page.getByPlaceholder('أدخل كلمة المرور')).toHaveValue('');
    approved = true;
    await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await expect(page).toHaveURL(/\/merchant$/);
  });
}
