import { test, expect, type Page } from '@playwright/test';
// One of each outcome a merchant's orders can reach, internal (local status) and
// external (Olivery state); repeated to fill the period.
const OUTCOME_ROWS: Record<string, unknown>[] = [
  { status: 'Processing' },
  { status: 'Processing' },
  { status: 'Delivered' },
  { status: 'Completed' },
  { status: 'Printed Confirmed', oliveryStatus: 'delivered' },
  { status: 'In_Company', oliveryStatus: 'paid' },
  { status: 'Refused on Delivery' },
  { status: 'Printed Confirmed', oliveryStatus: 'rejected' },
  { status: 'Stuck' },
  { status: 'Cancelled' },
  { status: 'Cancelled', oliveryStatus: 'canceled' },
  { status: 'Postponed' },
  { status: 'Printed Confirmed', oliveryStatus: 'reschedule' },
  { status: 'Out for Delivery' },
];
async function setup(page: Page, role = 'Merchant') {
  const user = { userId: 7, role, firstName: 'أحمد', accountStatus: 'Approved' };
  const state = {
    balance: null as number | null,
    failProfile: false,
    failActivity: false,
    incomplete: false,
    empty: false,
    calls: [] as string[],
  };
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/api/')[1];
    state.calls.push(path + url.search);
    if (path === 'Auth/login')
      return route.fulfill({
        json: { data: { user, token: 'test-session', dollarBalance: '1250.00' } },
      });
    if (path === 'User/7')
      return route.fulfill(
        state.failProfile
          ? { status: 503, json: { message: 'offline' } }
          : { json: { data: { ...user, dollarBalance: state.balance } } },
      );
    if (path === 'orders') {
      const from = url.searchParams.get('FromDate');
      const status = url.searchParams.get('Status');
      if (from) {
        if (state.failActivity) return route.fulfill({ status: 503, json: { message: 'offline' } });
        const records = Array.from({ length: state.empty ? 0 : 28 }, (_, i) => ({
          orderId: 1000 + i,
          customerName: 'عميل',
          orderType: 'Normal',
          ...OUTCOME_ROWS[i % OUTCOME_ROWS.length],
          createdAt: new Date(
            new Date(from).getTime() + (i % 7) * 86400000 + 3600000,
          ).toISOString(),
        }));
        const pageNumber = Number(url.searchParams.get('page'));
        return route.fulfill({
          json: {
            data: {
              items: state.incomplete
                ? records.slice(0, 2)
                : pageNumber === 1
                  ? records.slice(0, 14)
                  : records.slice(14),
              page: pageNumber,
              totalCount: records.length,
              totalPages: state.empty ? 1 : 2,
            },
          },
        });
      }
      const items = state.empty
        ? []
        : [
            {
              orderId: 1048,
              customerName: 'سارة أحمد',
              orderTotalUSD: 70,
              status: status ?? 'Processing',
              createdAt: new Date().toISOString(),
            },
            {
              orderId: 1047,
              customerName: 'محمد علي',
              orderTotalUSD: 45,
              status: 'Out for Delivery',
              createdAt: new Date().toISOString(),
            },
            {
              orderId: 1046,
              customerName: 'نور خالد',
              orderTotalUSD: 110,
              status: 'Delivered',
              createdAt: new Date().toISOString(),
            },
          ];
      const size = Number(url.searchParams.get('pageSize'));
      return route.fulfill({
        json: {
          data: {
            items: size === 1 ? items.slice(0, 1) : items,
            page: 1,
            totalPages: state.empty ? 1 : 128,
            totalCount: state.empty
              ? 0
              : status === 'Processing'
                ? 24
                : status === 'Delivered'
                  ? 104
                  : 128,
          },
        },
      });
    }
    const detail = /^orders\/(\d+)$/.exec(path);
    if (detail)
      return route.fulfill({
        json: {
          data: {
            orderId: Number(detail[1]),
            customerName: detail[1] === '1048' ? 'سارة أحمد' : 'عميل',
            status: 'Processing',
            orderType: 'Normal',
            customerArea: 'دمشق',
            olivery: null,
            items: [],
            orderTotalUSD: 70,
          },
        },
      });
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'نظرة على حسابك' })).toBeVisible();
  return state;
}
test('merchant home retains login balance, refreshes zero, hides amount and removes catalog', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const state = await setup(page);
  await expect(page.getByTestId('balance-amount')).toHaveText('1,250.00 USD');
  await expect(page.getByText('آخر رصيد معروف', { exact: true })).toBeVisible();
  await expect(page.getByText('اكتشف المنتجات')).toHaveCount(0);
  expect(state.calls.some((path) => path.startsWith('Product/'))).toBe(false);
  await page.getByRole('button', { name: 'إخفاء الرصيد' }).click();
  await expect(page.getByTestId('balance-amount')).toHaveText('••••••');
  await page.getByRole('button', { name: 'إظهار الرصيد' }).click();
  state.balance = 0;
  await page.getByRole('button', { name: 'تحديث الرصيد' }).click();
  await expect(page.getByTestId('balance-amount')).toHaveText('0.00 USD');
  await expect(page.getByText('رصيد حسابك', { exact: true })).toBeVisible();
  state.failProfile = true;
  await page.getByRole('button', { name: 'تحديث الرصيد' }).click();
  await expect(page.getByText('تعذر تحديث الرصيد. اضغط التحديث للمحاولة.')).toBeVisible();
  await expect(page.getByTestId('balance-amount')).toHaveText('0.00 USD');
  await page.getByRole('button', { name: 'فتح حسابي' }).click();
  await expect(page.getByTestId('profile-content').getByTestId('balance-amount')).toHaveText(
    '0.00 USD',
  );
  expect(errors).toEqual([]);
});
test('home charts load all pages, switch periods, show exact counts and open orders', async ({
  page,
}) => {
  const state = await setup(page);
  state.balance = 1250;
  await page.getByRole('button', { name: 'تحديث الرصيد' }).click();
  await expect(page.getByTestId('period-total')).toHaveText('28 طلبًا');
  for (const [title, count] of [
    ['إجمالي الطلبات', 28],
    ['قيد المعالجة', 4],
    ['تم التسليم', 8],
    ['مرفوض', 4],
    ['عالق', 2],
    ['ملغي', 4],
    ['مؤجل', 4],
  ] as const)
    await expect(
      page.getByRole('button', { name: `${title}: ${count}`, exact: true }),
    ).toBeVisible();
  expect(state.calls.some((path) => path.includes('page=2'))).toBe(true);
  // Counters come from the fully loaded period, never from Order.Status-only server filters.
  expect(state.calls.some((path) => path.includes('Status='))).toBe(false);
  await page.getByRole('button', { name: 'تم التسليم: 8', exact: true }).click();
  const sheet = page.getByTestId('outcome-sheet');
  await expect(sheet.getByRole('button', { name: /^فتح طلب #/ })).toHaveCount(8);
  await expect(sheet.getByText('تم التسليم', { exact: true })).toHaveCount(8);
  await page.screenshot({ path: 'test-results/home-delivered-sheet.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'إغلاق قائمة الطلبات', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 1550 });
  await page.screenshot({
    path: 'test-results/home-dashboard.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  // All four secondary counters share one row even at 320px.
  const tops = await Promise.all(
    ['مرفوض', 'عالق', 'ملغي', 'مؤجل'].map(async (title) =>
      Math.round(
        (await page.getByRole('button', { name: new RegExp(`^${title}: `) }).boundingBox())!.y,
      ),
    ),
  );
  expect(new Set(tops).size).toBe(1);
  await page.screenshot({ path: 'test-results/home-merchant-320.png', fullPage: true });
  await page.getByRole('button', { name: 'آخر 30 أيام', exact: true }).click();
  await expect(page.getByTestId('period-total')).toHaveText('28 طلبًا');
  await expect(page.getByText('اسحب الرسم أفقيًا، واضغط على اليوم لعرض تفاصيله')).toBeVisible();
  await page
    .getByTestId('order-activity')
    .getByRole('button', { name: /: 4 طلب/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'فتح طلب #1048', exact: true }).click();
  await expect(page.getByText('العميل: سارة أحمد')).toBeVisible();
});
test('failed or incomplete chart shows no partial totals and can recover', async ({ page }) => {
  const state = await setup(page);
  await expect(page.getByTestId('period-total')).toBeVisible();
  state.failActivity = true;
  await page.getByRole('button', { name: 'آخر 30 أيام', exact: true }).click();
  await expect(
    page.getByText('تعذر تحميل بيانات الفترة كاملة. أعد المحاولة لعرض رسم دقيق.'),
  ).toBeVisible();
  await expect(page.getByTestId('period-total')).toHaveCount(0);
  state.failActivity = false;
  state.incomplete = true;
  await page.getByRole('button', { name: 'إعادة تحميل الرسم' }).click();
  await expect(
    page.getByText('تعذر تحميل بيانات الفترة كاملة. أعد المحاولة لعرض رسم دقيق.'),
  ).toBeVisible();
  state.incomplete = false;
  await page.getByRole('button', { name: 'إعادة تحميل الرسم' }).click();
  await expect(page.getByTestId('period-total')).toHaveText('28 طلبًا');
});
test('sales home at 320px has no wallet and supports empty activity and new order', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  const state = await setup(page, 'SalesEmployee');
  await expect(page.getByTestId('balance-card')).toHaveCount(0);
  state.empty = true;
  await page.getByRole('button', { name: 'آخر 30 أيام', exact: true }).click();
  await expect(page.getByText('لا توجد طلبات في هذه الفترة')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: 'test-results/home-sales-320.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'إنشاء طلب جديد', exact: true }).click();
  await expect(page).toHaveURL(/\/sales-employee\/create-order/);
});
