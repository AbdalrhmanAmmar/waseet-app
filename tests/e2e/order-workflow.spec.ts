import { test, expect, type Page } from '@playwright/test';
const paths = {
  Merchant: 'merchant',
  SalesEmployee: 'sales-employee',
  ManagementEmployee: 'management-employee',
  DeliveryAgent: 'delivery-agent',
} as const;
type Role = keyof typeof paths;
async function setup(page: Page, role: Role, external = false) {
  const calls: string[] = [];
  const writes: { method: string; body: Record<string, unknown> }[] = [];
  const state = {
    failSave: false,
    failAreas: false,
    invalidDetail: false,
    order: {
      orderId: 21,
      customerName: 'محمد أحمد',
      customerMobile: '0991234567',
      customerArea: external ? 'حلب' : 'دمشق',
      customerAddress: 'شارع النصر 12',
      status: 'Processing',
      deliveryStatus: 'Assigned',
      createdAt: '2026-09-19T10:00:00Z',
      deliveryFee: 5,
      orderTotalUSD: 35,
      items: [
        {
          productCode: 11,
          productName: 'حقيبة أنيقة',
          quantity: 2,
          actualSellPriceUSD: 15,
          merchantSellPriceUSD: 12,
          color: 'أسود',
        },
      ],
    },
    history: [] as Record<string, unknown>[],
  };
  const user = { userId: 7, role, accountStatus: 'Approved', firstName: 'أحمد' };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split('/api/')[1];
    calls.push(path);
    const reply = (data: unknown) => route.fulfill({ json: { isSuccess: true, data } });
    if (path === 'Auth/login') return reply({ user, token: 'test' });
    expect(request.headers().authorization).toBe('Bearer test');
    if (path === 'User/7') return reply(user);
    if (path === 'delivery-areas')
      return state.failAreas
        ? route.fulfill({ status: 503, json: { message: 'offline' } })
        : reply([
            { deliveryAreaId: 1, city: 'دمشق', fee: 5, isInternalDelivery: true },
            { deliveryAreaId: 2, city: 'حلب', fee: 7, isInternalDelivery: false },
          ]);
    if (path === 'orders/statuses')
      return reply(
        [
          'Pending',
          'Processing',
          'Confirmed',
          'Out for Delivery',
          'Delivered',
          'Stuck',
          'Cancelled',
          'Closed',
        ].map((status) => ({ status, isTerminal: ['Closed', 'Cancelled'].includes(status) })),
      );
    if (path === 'orders/21/history') return reply(state.history);
    if (path === 'orders/21/status' || (path === 'orders/21' && request.method() === 'PUT')) {
      const body = request.postDataJSON();
      writes.push({ method: request.method(), body });
      if (state.failSave)
        return route.fulfill({ status: 403, json: { message: 'Not authorized' } });
      if (request.method() === 'PUT') Object.assign(state.order, body);
      else {
        state.history.unshift({
          fromStatus: state.order.status,
          toStatus: body.targetStatus,
          changedAt: '2026-09-19T12:00:00Z',
          changedByRole: role,
          changedById: 7,
          note: body.note,
        });
        state.order.status = body.targetStatus;
      }
      return reply(state.order);
    }
    if (path === 'orders/21')
      return reply(state.invalidDetail ? { ...state.order, items: null } : state.order);
    if (path === 'orders' || path === 'orders/my-deliveries')
      return reply({ items: [state.order], page: 1, totalPages: 1, totalCount: 1 });
    return reply([]);
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${paths[role]}$`));
  await navigate(page, `/${paths[role]}/order?id=21`);
  await expect(page.getByText('العميل: محمد أحمد', { exact: true })).toBeVisible();
  return { state, calls, writes };
}
async function navigate(page: Page, path: string) {
  await page.evaluate((url) => {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}
async function saveStatus(page: Page) {
  await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
}
for (const role of Object.keys(paths) as Role[]) {
  test(`${role}: internal status and complete editing use guarded endpoints`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const api = await setup(page, role);
    await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
    await expect(page.getByRole('radio', { name: 'تم التسليم', exact: true })).toBeDisabled();
    await page.getByRole('radio', { name: 'مؤكد', exact: true }).click();
    await saveStatus(page);
    await expect(page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true })).toHaveCount(
      0,
    );
    expect(api.writes[0]).toEqual({ method: 'POST', body: { targetStatus: 'Confirmed' } });
    await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
    await expect(page).toHaveURL(/edit-order/);
    await page.getByRole('textbox', { name: 'كمية المنتج 1', exact: true }).fill('٣');
    await page.getByRole('textbox', { name: 'لون المنتج 1', exact: true }).fill('أبيض');
    await page
      .getByRole('textbox', { name: 'العنوان التفصيلي *', exact: true })
      .fill('شارع جديد، بناء 9');
    await page.getByRole('button', { name: 'تغيير منطقة التوصيل', exact: true }).click();
    await expect(page.getByText('حلب', { exact: true })).toHaveCount(0);
    await page.getByText('دمشق', { exact: true }).last().click();
    await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
    expect(api.writes).toHaveLength(1);
    await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
    await expect(page.getByText('تم حفظ تعديلات الطلب بنجاح', { exact: true })).toBeVisible();
    expect(api.writes[1]).toEqual({
      method: 'PUT',
      body: {
        customerName: 'محمد أحمد',
        customerMobile: '0991234567',
        customerArea: 'دمشق',
        customerAddress: 'شارع جديد، بناء 9',
        items: [{ productCode: 11, quantity: 3, actualSellPriceUSD: 15, color: 'أبيض' }],
      },
    });
    await page.getByRole('button', { name: 'العودة إلى تفاصيل الطلب', exact: true }).click();
    await expect(page.getByText('اللون: أبيض', { exact: true })).toBeVisible();
    if (role === 'SalesEmployee') {
      await expect(page.getByText(/سعر التاجر/)).toHaveCount(0);
      expect(api.calls.some((p) => /^Product\/\d|Product\/all/.test(p))).toBe(false);
    }
    expect(errors).toEqual([]);
  });
  test(`${role}: external order editing is locked and resolving stuck needs a note`, async ({
    page,
  }) => {
    const api = await setup(page, role, true);
    await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
    await expect(page.getByRole('radio')).toHaveCount(2);
    await page.getByRole('radio', { name: 'عالق', exact: true }).click();
    await page.getByRole('textbox', { name: 'ملاحظات تغيير الحالة' }).fill('تعذر التواصل');
    await saveStatus(page);
    await page.getByRole('button', { name: 'حل الطلب المتعثر', exact: true }).click();
    await page.getByRole('radio', { name: 'قيد المعالجة', exact: true }).click();
    await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('ملاحظة حل التعثر');
    expect(api.writes).toHaveLength(1);
    await page.getByRole('textbox', { name: 'ملاحظات تغيير الحالة' }).fill('تم تصحيح رقم التواصل');
    await saveStatus(page);
    await expect(page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true })).toHaveCount(
      0,
    );
    expect(api.writes[1].body).toEqual({
      targetStatus: 'Processing',
      note: 'تم تصحيح رقم التواصل',
    });
    await navigate(page, `/${paths[role]}/edit-order?id=21`);
    await expect(
      page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }),
    ).toBeDisabled();
  });
}
test('permission rejection retains the edit draft and review; retry sends the same payload', async ({
  page,
}) => {
  const api = await setup(page, 'SalesEmployee');
  api.state.failSave = true;
  await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
  await page.getByRole('textbox', { name: 'لون المنتج 1', exact: true }).fill('أزرق');
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
  await expect(page.getByRole('alert').last()).toContainText('الخادم لا يسمح لحسابك');
  await page.getByRole('button', { name: 'متابعة التعديل', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'لون المنتج 1', exact: true })).toHaveValue(
    'أزرق',
  );
  api.state.failSave = false;
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
  await expect(page.getByText('تم حفظ تعديلات الطلب بنجاح', { exact: true })).toBeVisible();
  expect(api.writes).toHaveLength(2);
  expect(api.writes[0]).toEqual(api.writes[1]);
});
test('revalidation blocks an edit if the original area became external while reviewing', async ({
  page,
}) => {
  const api = await setup(page, 'Merchant');
  await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
  await page.getByRole('textbox', { name: 'لون المنتج 1', exact: true }).fill('أزرق');
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  api.state.order.customerArea = 'حلب';
  await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
  await expect(page.getByRole('alert').last()).toContainText('المنطقة الأصلية والجديدة');
  expect(api.writes).toHaveLength(0);
});
test('a stale status selection cannot overwrite a new server status', async ({ page }) => {
  const api = await setup(page, 'Merchant');
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await page.getByRole('radio', { name: 'مؤكد', exact: true }).click();
  await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  api.state.order.status = 'Stuck';
  await page.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('تغيرت حالة الطلب');
  expect(api.writes).toHaveLength(0);
});
test('unknown delivery metadata blocks actions until retry succeeds', async ({ page }) => {
  const api = await setup(page, 'ManagementEmployee');
  api.state.failAreas = true;
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('تعذر التحقق');
  api.state.failAreas = false;
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).last().click();
  await page.getByRole('radio', { name: 'مؤكد', exact: true }).click();
  await saveStatus(page);
  await expect(page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true })).toHaveCount(
    0,
  );
});
test('details, history and waybill stay readable on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const api = await setup(page, 'Merchant');
  api.state.history = [
    {
      changedAt: '2026-09-19T12:00:00Z',
      fromStatus: 'Pending',
      toStatus: 'Processing',
      changedByRole: 'Merchant',
      note: 'ملاحظة المتابعة',
    },
  ];
  await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/order-details-320.png', fullPage: true });
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'معاينة وطباعة البوليصة', exact: true }).click();
  const preview = await popup;
  await expect(preview.getByText('حقيبة أنيقة', { exact: true })).toBeVisible();
  await expect(preview.getByText('أسود', { exact: true })).toBeVisible();
  await expect(preview.getByRole('button', { name: 'طباعة / حفظ PDF' })).toBeVisible();
  await expect(preview.getByText(/سعر التاجر/)).toHaveCount(0);
});
test('edit supports complete replacement of items and confirms discarding unsaved changes', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee');
  await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
  await page.getByRole('textbox', { name: 'لون المنتج 1', exact: true }).fill('أخضر');
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await expect(page.getByText('مغادرة التعديل؟', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'متابعة التعديل', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'لون المنتج 1', exact: true })).toHaveValue(
    'أخضر',
  );
  await page.getByRole('button', { name: 'إضافة منتج', exact: true }).click();
  await page.getByRole('textbox', { name: 'كود المنتج 2', exact: true }).fill('11');
  await page.getByRole('textbox', { name: 'سعر بيع المنتج 2', exact: true }).fill('20');
  await page.getByRole('textbox', { name: 'لون المنتج 2', exact: true }).fill('أزرق');
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('تكرار');
  await page.getByRole('textbox', { name: 'كود المنتج 2', exact: true }).fill('22');
  await page.getByRole('button', { name: 'حذف المنتج 1', exact: true }).click();
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  await expect(page.getByText('مراجعة تعديلات الطلب', { exact: true })).toBeVisible();
  await page.screenshot({
    path: 'test-results/edit-order-review.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
  await expect(page.getByText('تم حفظ تعديلات الطلب بنجاح', { exact: true })).toBeVisible();
  expect(api.writes[0].body.items).toEqual([
    { productCode: 22, quantity: 1, actualSellPriceUSD: 20, color: 'أزرق' },
  ]);
});
test('confirmed external order cannot advance manually and malformed details render an error', async ({
  page,
}) => {
  const api = await setup(page, 'DeliveryAgent', true);
  api.state.order.status = 'Confirmed';
  await page.getByRole('button', { name: 'تحديث حالة التوصيل', exact: true }).click();
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'عالق', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'مراجعة التغيير', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true }).click();
  api.state.invalidDetail = true;
  await page.getByRole('button', { name: 'تحديث حالة التوصيل', exact: true }).click();
  await expect(page.getByText('تعذر التحقق من تفاصيل الطلب', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toBeDisabled();
  expect(api.writes).toHaveLength(0);
});
