import { expect, test, type Page } from '@playwright/test';
async function setup(
  page: Page,
  options: {
    role?: string;
    failHistory?: boolean;
    failEmployees?: boolean;
    foreign?: boolean;
    uncertain?: boolean;
    missingTotal?: boolean;
  } = {},
) {
  const user = {
    userId: 7,
    role: options.role ?? 'Merchant',
    firstName: 'أحمد',
    lastName: 'خالد',
    accountStatus: 'Approved',
    dollarBalance: 1250,
    ...(options.missingTotal ? {} : { totalPaidUSD: 3500 }),
  };
  const employees = [
    {
      userId: 88,
      role: 'MerchantEmployee',
      ownerMerchantId: options.foreign ? 99 : 7,
      firstName: 'محمد',
      lastName: 'أحمد',
      email: 'mohamed@example.com',
      accountStatus: 'Pending',
      createdAt: '2026-11-18T09:00:00Z',
    },
    {
      userId: 89,
      role: 'MerchantEmployee',
      ownerMerchantId: 7,
      firstName: 'سارة',
      lastName: 'خالد',
      email: 'sara@example.com',
      accountStatus: 'Approved',
      createdAt: '2026-11-15T09:00:00Z',
    },
  ];
  const withdrawals = [
    {
      withdrawalRequestId: 1045,
      merchantUserId: options.foreign ? 99 : 7,
      amount: 150,
      status: 'Pending',
      requestedAt: '2026-11-18T09:00:00Z',
      note: 'طلب سحب جزء من الرصيد',
      resolvedAt: null,
      adminNote: null,
    },
    {
      withdrawalRequestId: 1038,
      merchantUserId: 7,
      amount: 200,
      status: 'Approved',
      requestedAt: '2026-11-15T09:00:00Z',
      note: 'سحب أرباح الشهر',
      resolvedAt: '2026-11-16T11:45:00Z',
      adminNote: 'تمت الموافقة على الطلب',
    },
    {
      withdrawalRequestId: 1029,
      merchantUserId: 7,
      amount: 100,
      status: 'Rejected',
      requestedAt: '2026-11-12T09:00:00Z',
      note: null,
      resolvedAt: '2026-11-13T09:00:00Z',
      adminNote: 'راجع بيانات الطلب',
    },
  ];
  const calls: { path: string; method: string; params: Record<string, string> }[] = [];
  const writes: { path: string; method: string; status: string | null; body: string | null }[] = [];
  const state = {
    failHistory: !!options.failHistory,
    failEmployees: !!options.failEmployees,
    settle: !options.uncertain,
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.split('/api/')[1];
    calls.push({ path, method: request.method(), params: Object.fromEntries(url.searchParams) });
    if (path === 'Auth/login')
      return route.fulfill({ json: { data: { user, token: 'merchant-test' } } });
    expect(request.headers().authorization).toBe('Bearer merchant-test');
    if (path === 'User/7') return route.fulfill({ json: { data: user } });
    if (path === 'withdrawal-requests/mine') {
      if (state.failHistory)
        return route.fulfill({ status: 503, json: { message: 'تعذر تحميل سجل السحوبات' } });
      const status = url.searchParams.get('status');
      const from = url.searchParams.get('fromDate');
      const to = url.searchParams.get('toDate');
      return route.fulfill({
        json: {
          isSuccess: true,
          data: withdrawals.filter(
            (item) =>
              (!status || item.status === status) &&
              (!from || item.requestedAt.slice(0, 10) >= from) &&
              (!to || item.requestedAt.slice(0, 10) <= to),
          ),
        },
      });
    }
    if (path === 'User/employees')
      return route.fulfill({
        status: state.failEmployees ? 503 : 200,
        json: state.failEmployees
          ? { message: 'تعذر تحميل الموظفين' }
          : { isSuccess: true, data: employees },
      });
    if (path.startsWith('User/employees/')) {
      const id = Number(path.split('/')[2]);
      const employee = employees.find((item) => item.userId === id);
      if (request.method() !== 'GET') {
        writes.push({
          path,
          method: request.method(),
          status: url.searchParams.get('status'),
          body: request.postData(),
        });
        await new Promise((resolve) => setTimeout(resolve, 150));
        if (request.method() === 'DELETE')
          employees.splice(
            employees.findIndex((item) => item.userId === id),
            1,
          );
        else if (employee && state.settle) employee.accountStatus = url.searchParams.get('status')!;
        return route.fulfill({
          status: options.uncertain && !state.settle ? 503 : 200,
          json:
            options.uncertain && !state.settle ? { message: 'انقطع الاتصال' } : { isSuccess: true },
        });
      }
      return route.fulfill({
        status: employee ? 200 : 404,
        json: employee ? { data: employee } : { message: 'الموظف غير موجود' },
      });
    }
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('merchant@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('tab', { name: /حسابي/ })).toBeVisible();
  return { user, employees, withdrawals, calls, writes, state };
}
async function employeesPage(page: Page) {
  await page.getByRole('button', { name: 'إدارة الموظفين', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true }),
  ).toBeVisible();
}
test('merchant sees withdrawn total, hides both amounts, filters history by status and dates and reads details', async ({
  page,
}) => {
  const api = await setup(page);
  await expect(page.getByTestId('withdrawn-amount')).toContainText('3,500.00');
  await page.screenshot({ path: 'test-results/merchant-finance-home.png', fullPage: true });
  await page.getByRole('button', { name: 'إخفاء الرصيد', exact: true }).click();
  await expect(page.getByTestId('balance-amount')).toHaveText('••••••');
  await expect(page.getByTestId('withdrawn-amount')).toHaveText('••••••');
  await page.getByRole('button', { name: 'إظهار الرصيد', exact: true }).click();
  await page.getByRole('button', { name: 'سجل السحوبات', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'تفاصيل طلب السحب 1045', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/merchant-withdrawals.png', fullPage: true });
  await page.getByRole('button', { name: 'حالة السحب: تمت الموافقة', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'تفاصيل طلب السحب 1045', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'تفاصيل طلب السحب 1038', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'تحديد فترة السحوبات' }).click();
  await page.getByLabel('من تاريخ السحب').fill('2026-11-18');
  await page.getByLabel('إلى تاريخ السحب').fill('2026-11-01');
  await page.getByRole('button', { name: 'تطبيق الفترة', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('تاريخ البداية');
  await page.getByLabel('من تاريخ السحب').fill('2026-11-01');
  await page.getByLabel('إلى تاريخ السحب').fill('2026-11-18');
  await page.getByRole('button', { name: 'تطبيق الفترة', exact: true }).click();
  await page.getByRole('button', { name: 'تفاصيل طلب السحب 1038', exact: true }).click();
  await expect(page.getByText('سحب أرباح الشهر', { exact: true })).toBeVisible();
  await expect(page.getByText('تمت الموافقة على الطلب', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/merchant-withdrawal-details.png', fullPage: true });
  expect(
    api.calls.some(
      (item) =>
        item.params.fromDate === '2026-11-01' &&
        item.params.toDate === '2026-11-18' &&
        item.params.status === 'Approved',
    ),
  ).toBe(true);
  expect(
    api.calls
      .filter((item) => item.path === 'withdrawal-requests/mine')
      .every((item) => !('merchantUserId' in item.params)),
  ).toBe(true);
  expect(api.writes).toHaveLength(0);
});
test('employee approval and rejection remain in all results; delete is explicit and preserves the merchant session', async ({
  page,
}) => {
  const api = await setup(page);
  await employeesPage(page);
  await page.screenshot({ path: 'test-results/merchant-employees.png', fullPage: true });
  await page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true }).click();
  await page.getByRole('button', { name: 'الموافقة على الموظف', exact: true }).click();
  expect(api.writes).toHaveLength(0);
  await page.getByRole('button', { name: 'تأكيد الموافقة', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/merchant-employee-approve.png', fullPage: true });
  await page.getByRole('button', { name: 'تأكيد الموافقة', exact: true }).click();
  await expect(page.getByText('تمت الموافقة على الموظف.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'رفض الموظف', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد الرفض', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/merchant-employee-reject.png', fullPage: true });
  await page.getByRole('button', { name: 'تأكيد الرفض', exact: true }).click();
  await expect(page.getByText('تم رفض حساب الموظف.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'العودة إلى الموظفين', exact: true }).click();
  const card = page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true });
  await expect(card).toContainText('مرفوض');
  await card.click();
  await page.getByRole('button', { name: 'حذف الموظف', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد الحذف', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/merchant-employee-delete.png', fullPage: true });
  await page.getByRole('button', { name: 'إلغاء', exact: true }).click();
  expect(api.writes).toHaveLength(2);
  await page.getByRole('button', { name: 'حذف الموظف', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد الحذف', exact: true }).click();
  await expect(page.getByText('تم حذف الموظف وتحديث قائمة فريقك.', { exact: true })).toBeVisible();
  await expect(card).toHaveCount(0);
  expect(api.writes.map(({ method, status, body }) => ({ method, status, body }))).toEqual([
    { method: 'PUT', status: 'Approved', body: null },
    { method: 'PUT', status: 'Rejected', body: null },
    { method: 'DELETE', status: null, body: null },
  ]);
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('tab', { name: /حسابي/ }).click();
  await expect(page.getByText('رقم الحساب #7', { exact: true })).toBeVisible();
});
test('unknown outcome stays blocked across navigation and read-only verification resolves it', async ({
  page,
}) => {
  const api = await setup(page, { uncertain: true });
  await employeesPage(page);
  await page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true }).click();
  await page.getByRole('button', { name: 'الموافقة على الموظف', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد الموافقة', exact: true }).click();
  await expect(page.getByRole('button', { name: 'التحقق من نتيجة الإجراء' }).last()).toBeVisible();
  await page.getByRole('button', { name: 'رجوع', exact: true }).last().click();
  await expect(
    page.getByRole('button', { name: 'الموافقة على الموظف', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'العودة إلى الموظفين', exact: true }).click();
  await page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'الموافقة على الموظف', exact: true }),
  ).toBeDisabled();
  api.state.settle = true;
  api.employees[0].accountStatus = 'Approved';
  await page.getByRole('button', { name: 'التحقق من نتيجة الإجراء', exact: true }).click();
  await expect(page.getByText('تمت الموافقة على الموظف.', { exact: true })).toBeVisible();
  expect(api.writes).toHaveLength(1);
});
test('missing withdrawn amount is unavailable; failed and empty histories can recover at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  const api = await setup(page, { missingTotal: true, failHistory: true, failEmployees: true });
  await expect(page.getByTestId('withdrawn-amount')).toHaveText('غير متاح');
  await page.getByRole('button', { name: 'سجل السحوبات', exact: true }).click();
  await expect(page.getByRole('button', { name: 'إعادة المحاولة', exact: true })).toBeVisible();
  api.state.failHistory = false;
  api.withdrawals.splice(0);
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(page.getByText('لا توجد طلبات سحب بهذه الفلاتر', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('button', { name: 'إدارة الموظفين', exact: true }).click();
  await expect(page.getByRole('button', { name: 'إعادة المحاولة', exact: true })).toBeVisible();
  api.state.failEmployees = false;
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true }),
  ).toBeVisible();
  await page.getByLabel('البحث في الموظفين').fill('سارة');
  await expect(page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'عرض الموظف سارة خالد', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/merchant-employees-320.png', fullPage: true });
});
test('foreign finance and employee rows are rejected instead of exposing or controlling another merchant records', async ({
  page,
}) => {
  const api = await setup(page, { foreign: true });
  await page.getByRole('button', { name: 'سجل السحوبات', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('يخص حسابك');
  await expect(
    page.getByRole('button', { name: 'تفاصيل طلب السحب 1045', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('button', { name: 'إدارة الموظفين', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('غير تابع لحسابك');
  await expect(page.getByRole('button', { name: 'عرض الموظف محمد أحمد', exact: true })).toHaveCount(
    0,
  );
  expect(api.writes).toHaveLength(0);
});
test('merchant employees cannot access finance or management through direct routes', async ({
  page,
}) => {
  const api = await setup(page, { role: 'MerchantEmployee' });
  for (const path of [
    '/merchant/employees',
    '/merchant/employee?id=88',
    '/merchant/withdrawals',
    '/merchant/withdrawal-details?id=1045',
  ]) {
    // SPA navigation preserves the in-memory web session.
    await page.evaluate((destination) => {
      history.pushState({}, '', destination);
      dispatchEvent(new PopStateEvent('popstate'));
    }, path);
    await expect(page.getByRole('button', { name: 'إنشاء طلب جديد', exact: true })).toBeVisible();
  }
  expect(
    api.calls.some(
      (item) =>
        item.path.startsWith('User/employees') || item.path.startsWith('withdrawal-requests'),
    ),
  ).toBe(false);
});
