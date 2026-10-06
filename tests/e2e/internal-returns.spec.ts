import { test, expect, type Page } from '@playwright/test';
async function setup(
  page: Page,
  role = 'ManagementEmployee',
  options: {
    lost?: boolean;
    noId?: boolean;
    flag?: boolean;
    denied?: boolean;
    unknownDelivery?: boolean;
    missingAssignment?: boolean;
  } = {},
) {
  const writes: Record<string, unknown>[] = [];
  const original: Record<string, unknown> = {
    orderId: 21,
    orderType: 'Normal',
    status: 'Delivered',
    oliveryOrderId: null,
    deliveryMode: options.unknownDelivery ? undefined : 'internal',
    assignedToEmployeeId: options.missingAssignment ? undefined : options.denied ? 99 : 7,
    assignedToDeliveryAgentId: 7,
    customerName: 'محمد أحمد',
    customerMobile: '0991234567',
    customerArea: options.unknownDelivery ? 'منطقة غير معروفة' : 'دمشق',
    customerAddress: 'شارع النصر',
    orderTotalUSD: 210.2,
    items: [
      {
        orderItemId: 51,
        productCode: 11,
        productName: 'حقيبة أنيقة',
        color: 'أسود',
        quantity: 2,
        actualSellPriceUSD: 105.1,
        merchantSellPriceUSD: 80,
      },
    ],
    ...(options.flag !== undefined ? { isReturnProcessed: options.flag } : {}),
  };
  const returned = {
    ...original,
    orderId: 22,
    originalOrderId: 21,
    orderType: 'Return',
    status: 'Processing',
    totalAdminProfitUSD: 20,
    totalMerchantProfitUSD: -2,
    items: [
      {
        orderItemId: 61,
        originalOrderItemId: 51,
        productCode: 11,
        productName: 'حقيبة أنيقة',
        color: 'أسود',
        quantity: 1,
        actualSellPriceUSD: 78,
      },
    ],
  };
  const user = { userId: 7, role, accountStatus: 'Approved', firstName: 'أحمد' };
  const path = (
    {
      ManagementEmployee: 'management-employee',
      Merchant: 'merchant',
      SalesEmployee: 'sales-employee',
      DeliveryAgent: 'delivery-agent',
    } as Record<string, string>
  )[role];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/**', async (route) => {
    const req = route.request(),
      endpoint = new URL(req.url()).pathname.split('/api/')[1];
    const reply = (data: unknown) => route.fulfill({ json: { isSuccess: true, data } });
    if (endpoint === 'Auth/login') return reply({ user, token: 'test' });
    expect(req.headers().authorization).toBe('Bearer test');
    if (endpoint === 'User/7') return reply(user);
    if (endpoint === 'delivery-areas')
      return reply([{ deliveryAreaId: 1, city: 'دمشق', isInternalDelivery: true, fee: 3 }]);
    if (endpoint === 'orders/21/internal-returns') {
      writes.push(req.postDataJSON());
      if (options.lost) return route.fulfill({ status: 503, json: { message: 'connection lost' } });
      original.isReturnProcessed = true;
      return reply(options.noId ? { message: 'created' } : returned);
    }
    if (endpoint === 'orders/22/status') {
      const body = req.postDataJSON();
      writes.push(body);
      returned.status = body.targetStatus;
      return reply(returned);
    }
    if (endpoint === 'orders/21') return reply(original);
    if (endpoint === 'orders/22') return reply(returned);
    if (endpoint === 'orders' || endpoint === 'orders/my-deliveries')
      return reply({ items: [original, returned], page: 1, totalPages: 1, totalCount: 2 });
    return reply([]);
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${path}$`));
  await navigate(page, `/${path}/order?id=21`);
  await expect(page.getByText('العميل: محمد أحمد', { exact: true })).toBeVisible();
  return { writes, original, returned, path };
}
async function navigate(page: Page, path: string) {
  await page.evaluate((url) => {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}
async function fill(page: Page) {
  await page.getByRole('button', { name: 'إنشاء مرتجع داخلي', exact: true }).click();
  await page.getByRole('checkbox', { name: 'إرجاع حقيبة أنيقة' }).click();
  await page.getByLabel('كمية الإرجاع للبند 51', { exact: true }).fill('1');
  await page.getByLabel('سعر إرجاع الوحدة بالدولار للبند 51', { exact: true }).fill('78');
  await page.getByRole('button', { name: 'مراجعة المرتجع', exact: true }).click();
  await expect(page.getByText('راجع المرتجع قبل الإنشاء')).toBeVisible();
}
test('missing processed flag: review, create once, navigate verified Return and complete with reviewed settlement', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const api = await setup(page);
  await fill(page);
  await page.screenshot({ path: 'test-results/internal-return-review.png', fullPage: true });
  await page.getByRole('button', { name: 'تأكيد إنشاء المرتجع', exact: true }).click();
  await expect(page.getByText('تم إنشاء المرتجع', { exact: true })).toBeVisible();
  expect(api.writes).toEqual([
    { items: [{ orderItemId: 51, quantity: 1, returnPriceUSD: 78, color: 'أسود' }] },
  ]);
  await page.getByRole('button', { name: 'عرض المرتجع #22' }).click();
  await expect(page.getByRole('button', { name: 'عرض الطلب الأصلي #21' })).toBeVisible();
  for (const name of ['مؤكد', 'جاري تسليم المرجع', 'تم تسليم المرجع', 'تم إتمام الإرجاع']) {
    await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
    await page.getByRole('radio', { name, exact: true }).click();
    await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
    if (name === 'تم إتمام الإرجاع') {
      await page.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
      await expect(page.getByText('أكد مراجعة الكميات والتسوية أولًا.')).toBeVisible();
      await page
        .getByRole('checkbox', { name: 'راجعت الكميات والتسوية وأوافق على إكمال المرتجع' })
        .click();
    }
    await page.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
    await expect(page.getByTestId('management-status-sheet')).toHaveCount(0);
  }
  expect(api.writes.slice(1)).toEqual(
    ['Confirmed', 'returned_in_progress', 'returned_delivered', 'completed_returned'].map(
      (targetStatus) => ({ targetStatus }),
    ),
  );
  await expect(page.getByText('التسوية المسجلة', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('unknown creation persists across reload and missing flag cannot authorize retry', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', { lost: true });
  await fill(page);
  await page.getByRole('button', { name: 'تأكيد إنشاء المرتجع', exact: true }).click();
  await expect(page.getByRole('button', { name: 'التحقق من المحاولة السابقة' })).toBeVisible();
  await page.reload();
  // The deliberately fake token cannot survive session hydration; authenticate again.
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(/management-employee$/);
  await navigate(page, '/management-employee/create-return?id=21');
  await expect(page.getByRole('button', { name: 'التحقق من المحاولة السابقة' })).toBeVisible();
  await page.getByRole('button', { name: 'التحقق من المحاولة السابقة' }).click();
  await expect(
    page.getByText('الخادم لم يؤكد نتيجة المحاولة بعد. راجع الإدارة قبل إعادة الإنشاء.'),
  ).toBeVisible();
  expect(api.writes).toHaveLength(1);
  api.original.isReturnProcessed = true;
  await page.getByRole('button', { name: 'التحقق من المحاولة السابقة' }).click();
  await expect(page.getByText('تم إنشاء المرتجع', { exact: true })).toBeVisible();
  expect(api.writes).toHaveLength(1);
});
test('successful creation without confirmed id is acknowledged without inventing link', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', { noId: true });
  await fill(page);
  await page.getByRole('button', { name: 'تأكيد إنشاء المرتجع', exact: true }).click();
  await expect(page.getByText('تم إنشاء المرتجع', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /عرض المرتجع #/ })).toHaveCount(0);
  expect(api.writes).toHaveLength(1);
});
for (const role of ['Merchant', 'SalesEmployee', 'DeliveryAgent'])
  test(`${role} cannot create internal returns`, async ({ page }) => {
    const api = await setup(page, role);
    await expect(page.getByRole('button', { name: 'إنشاء مرتجع داخلي', exact: true })).toHaveCount(
      0,
    );
    await navigate(page, `/${api.path}/order?id=22`);
    await expect(page.getByText('مرتجع داخلي', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
    await expect(page.getByRole('radio')).toHaveCount(0);
    expect(api.writes).toHaveLength(0);
  });
test('management can submit a return when original is assigned to another employee', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', { denied: true });
  await fill(page);
  await page.getByRole('button', { name: 'تأكيد إنشاء المرتجع', exact: true }).click();
  await expect(page.getByText('تم إنشاء المرتجع', { exact: true })).toBeVisible();
  expect(api.writes).toHaveLength(1);
});
test('prior return evidence blocks creation', async ({ page }) => {
  await setup(page, 'ManagementEmployee', { flag: true });
  await expect(page.getByRole('button', { name: 'إنشاء مرتجع داخلي', exact: true })).toBeDisabled();
});

test('management can submit a return without assignment metadata', async ({ page }) => {
  const api = await setup(page, 'ManagementEmployee', { missingAssignment: true });
  await fill(page);
  await page.getByRole('button', { name: 'تأكيد إنشاء المرتجع', exact: true }).click();
  await expect(page.getByText('تم إنشاء المرتجع', { exact: true })).toBeVisible();
  expect(api.writes).toHaveLength(1);
});
test('unknown delivery keeps return eligibility visible without enabling creation', async ({
  page,
}) => {
  await setup(page, 'ManagementEmployee', { unknownDelivery: true });
  await expect(page.getByRole('button', { name: 'إنشاء مرتجع داخلي', exact: true })).toBeDisabled();
  await expect(
    page.getByText('تعذر تحديد نوع توصيل الطلب. حدّث البيانات للتحقق.', { exact: true }),
  ).toBeVisible();
});
