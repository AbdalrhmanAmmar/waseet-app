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
    failReturn: false,
    lostReturn: false,
    syncStatus: null as string | null,
    failAreas: false,
    failStatuses: false,
    invalidDetail: false,
    order: {
      deliveryMode: null as string | null,
      orderType: 'Normal',
      oliveryOrderId: external ? 888 : null,
      userId: 7,
      assignedToEmployeeId: 7,
      assignedToDeliveryAgentId: 7,
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
      return state.failStatuses
        ? route.fulfill({ status: 403, json: { message: 'catalog forbidden' } })
        : reply(
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
    if (path === 'orders/21/delivery-status') {
      if (state.syncStatus) Object.assign(state.order, { oliveryStatus: state.syncStatus });
      return reply({ deliveryStatus: null });
    }
    if (path === 'orders/21/olivery-returns') {
      const body = request.postDataJSON();
      writes.push({ method: 'POST', body });
      if (state.failReturn)
        return route.fulfill({ status: 400, json: { message: 'Return rejected' } });
      if (state.lostReturn)
        return route.fulfill({ status: 503, json: { message: 'connection lost' } });
      Object.assign(state.order, { isReturnProcessed: true });
      for (const row of body.items) {
        const item = state.order.items.find(
          (i) => Number((i as Record<string, unknown>).orderItemId) === row.orderItemId,
        );
        if (item) Object.assign(item, { returnedQuantity: row.quantity });
      }
      return reply({ processed: true });
    }

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
    if (role !== 'ManagementEmployee') {
      await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
      await expect(page.getByRole('radio')).toHaveCount(1);
      await page.getByRole('radio', { name: 'ملغي', exact: true }).click();
      await saveStatus(page);
      await expect.poll(() => api.writes.length).toBe(1);
      expect(api.writes[0].body).toEqual({ targetStatus: 'Cancelled' });
      return;
    }
    await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
    await expect(page.getByRole('radio', { name: 'تم التسليم', exact: true })).toHaveCount(0);
    await page.getByRole('radio', { name: 'مؤكد', exact: true }).click();
    await saveStatus(page);
    await expect(page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true })).toHaveCount(
      0,
    );
    expect(api.writes[0]).toEqual({ method: 'POST', body: { targetStatus: 'Confirmed' } });
    await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
    await expect(page).toHaveURL(/edit-order/);
    await page.getByLabel('رقم هاتف إضافي (اختياري)', { exact: true }).fill('+20 (100) 123-4567');
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
        secondCustomerPhone: '+20 (100) 123-4567',
        items: [{ productCode: 11, quantity: 3, actualSellPriceUSD: 15, color: 'أبيض' }],
      },
    });
    await page.getByRole('button', { name: 'العودة إلى تفاصيل الطلب', exact: true }).click();
    await expect(page.getByText('اللون: أبيض', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
  test(`${role}: external permissions distinguish owner resolution, cancellation and assigned editing`, async ({
    page,
  }) => {
    const api = await setup(page, role, true);
    if (role === 'ManagementEmployee')
      await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toBeEnabled();
    else
      await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toHaveCount(0);
    api.state.order.status = 'Stuck';
    await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
    const sheet = page.getByTestId(
      `${role === 'Merchant' ? 'merchant' : role === 'SalesEmployee' ? 'sales' : role === 'ManagementEmployee' ? 'management' : 'delivery'}-status-sheet`,
    );
    if (role === 'DeliveryAgent') {
      await expect(sheet.getByRole('radio')).toHaveCount(1);
      await sheet.getByRole('radio', { name: 'ملغي', exact: true }).click();
    } else {
      await sheet.getByRole('radio', { name: 'قيد المعالجة', exact: true }).click();
      await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
      await expect(sheet.getByRole('alert')).toContainText('ملاحظة حل');
      await sheet.getByRole('textbox', { name: 'ملاحظات تغيير الحالة' }).fill('تم حل المشكلة');
    }
    await saveStatus(page);
    await expect(sheet).toHaveCount(0);
    expect(api.writes).toHaveLength(1);
  });
}

test('permission rejection retains the edit draft and review; retry sends the same payload', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee');
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
  const api = await setup(page, 'ManagementEmployee');
  await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
  await page.getByRole('textbox', { name: 'لون المنتج 1', exact: true }).fill('أزرق');
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  api.state.order.customerArea = 'حلب';
  await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
  await expect(page.getByRole('alert').last()).toContainText('المنطقة الأصلية والجديدة');
  expect(api.writes).toHaveLength(0);
});
test('a stale status selection cannot overwrite a new server status', async ({ page }) => {
  const api = await setup(page, 'ManagementEmployee');
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
  const api = await setup(page, 'ManagementEmployee');
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
  await page.getByRole('button', { name: /^تحديث حالة (التوصيل|زحل)$/ }).click();
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'عالق', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'مراجعة التغيير', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true }).click();
  api.state.invalidDetail = true;
  await page.getByRole('button', { name: /^تحديث حالة (التوصيل|زحل)$/ }).click();
  await expect(
    page.getByText('تعذر التحقق من تفاصيل الطلب', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toHaveCount(0);
  expect(api.writes).toHaveLength(0);
});

test('internal action sheet permits status update after reassignment', async ({ page }) => {
  const api = await setup(page, 'ManagementEmployee');
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await page.getByRole('radio', { name: 'مؤكد', exact: true }).click();
  await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  api.state.order.assignedToEmployeeId = 99;
  await page.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
  await expect(page.getByTestId('management-status-sheet')).toHaveCount(0);
  expect(api.writes).toHaveLength(1);
});
test('internal return stages and normal cancelled closure have distinct actions', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee');
  api.state.order.orderType = 'Return';
  api.state.order.status = 'Confirmed';
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(1);
  await expect(page.getByText('بدء نقل المرتجع', { exact: true })).toBeVisible();
  await page.getByRole('radio').click();
  await saveStatus(page);
  await expect.poll(() => api.writes.length).toBe(1);
  expect(api.writes[0].body).toEqual({ targetStatus: 'returned_in_progress' });
  await expect(page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true })).toHaveCount(
    0,
  );
  api.state.order.orderType = 'Normal';
  api.state.order.status = 'Cancelled';
  await page.getByRole('button', { name: /^تحديث حالة (التوصيل|زحل)$/ }).click();
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await expect(page.getByText('إغلاق كراجع', { exact: true })).toBeVisible();
  await page.getByRole('radio').click();
  await saveStatus(page);
  await expect.poll(() => api.writes.length).toBe(2);
  expect(api.writes[1].body).toEqual({ targetStatus: 'Completed_return' });
  await expect(page.getByRole('button', { name: 'إغلاق تحديث الحالة', exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toBeEnabled();
});
test('internal status sheet fits a small phone and requires stuck note', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await setup(page, 'ManagementEmployee');
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await page.getByRole('radio', { name: 'عالق', exact: true }).click();
  await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('سبب تعثر');
  await page
    .getByRole('textbox', { name: 'ملاحظات تغيير الحالة' })
    .fill('بانتظار تصحيح عنوان العميل');
  await page.screenshot({ path: 'test-results/internal-actions-320.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  await expect(page.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/internal-review-320.png', animations: 'disabled' });
});

test('merchant cancels from orders list using stored internal mode despite unavailable catalogs', async ({
  page,
}) => {
  const api = await setup(page, 'Merchant');
  api.state.order.deliveryMode = 'internal';
  api.state.order.customerArea = 'منطقة داخلية باسم مختلف';
  api.state.failAreas = true;
  api.state.failStatuses = true;
  await navigate(page, '/merchant/orders');
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  const sheet = page.getByTestId('merchant-status-sheet');
  await expect(sheet.getByRole('radio')).toHaveCount(1);
  await sheet.getByRole('radio', { name: 'ملغي', exact: true }).click();
  await saveStatus(page);
  await expect(sheet).toHaveCount(0);
  expect(api.writes).toEqual([{ method: 'POST', body: { targetStatus: 'Cancelled' } }]);
  await expect(page.getByRole('button', { name: 'فتح طلب #21', exact: true })).toContainText(
    'ملغي',
  );
});

test('merchant cancels detail response with olivery envelope and no ownership fields', async ({
  page,
}) => {
  const api = await setup(page, 'Merchant');
  Reflect.deleteProperty(api.state.order, 'oliveryOrderId');
  Reflect.deleteProperty(api.state.order, 'userId');
  Reflect.deleteProperty(api.state.order, 'assignedToEmployeeId');
  Reflect.deleteProperty(api.state.order, 'assignedToDeliveryAgentId');
  Object.assign(api.state.order, { olivery: null });
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  const sheet = page.getByTestId('merchant-status-sheet');
  await expect(sheet.getByRole('radio')).toHaveCount(1);
  await sheet.getByRole('radio', { name: 'ملغي', exact: true }).click();
  await saveStatus(page);
  await expect(sheet).toHaveCount(0);
  expect(api.writes).toEqual([{ method: 'POST', body: { targetStatus: 'Cancelled' } }]);
  await expect(page.getByText('تم تحديث حالة الطلب.', { exact: true })).toBeVisible();
});

test('external management prints using local order ID and nested shipment sequence', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', true);
  api.state.order.status = 'Confirmed';
  Reflect.deleteProperty(api.state.order, 'oliveryOrderId');
  Object.assign(api.state.order, {
    olivery: { orderId: 9001, sequence: 'SHIP-333', oliveryStatus: 'waiting' },
    deliveryStatus: null,
  });
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await page.getByRole('radio', { name: 'مطبوع مؤكد', exact: true }).click();
  await saveStatus(page);
  await expect(page.getByTestId('management-status-sheet')).toHaveCount(0);
  expect(api.writes[0].body).toEqual({ targetStatus: 'Printed Confirmed' });
  expect(api.calls).toContain('orders/21/status');
  expect(api.calls).not.toContain('orders/9001/status');
  await page.getByRole('button', { name: /^تحديث حالة (التوصيل|زحل)$/ }).click();
  await expect(page.getByText('مرجع الشحنة: SHIP-333', { exact: true })).toBeVisible();
  await expect.poll(() => api.calls.includes('orders/21/delivery-status')).toBe(true);
});
test('external merchant cannot cancel after printed confirmation', async ({ page }) => {
  const api = await setup(page, 'Merchant', true);
  api.state.order.status = 'Printed Confirmed';
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await expect(page.getByTestId('merchant-status-sheet').getByRole('radio')).toHaveCount(0);
  expect(api.writes).toHaveLength(0);
});
test('external editing permits assigned management while waiting and rejects a closed provider window', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', true);
  api.state.order.status = 'Printed Confirmed';
  Object.assign(api.state.order, { oliveryStatus: 'printing_waiting' });
  await page.getByRole('button', { name: /^تحديث حالة (التوصيل|زحل)$/ }).click();
  await expect(page.getByRole('button', { name: 'تعديل الطلب', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
  await page.getByRole('textbox', { name: 'العنوان التفصيلي *', exact: true }).fill('عنوان معدل');
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  Object.assign(api.state.order, { oliveryStatus: 'picked_up' });
  await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
  await expect(page.getByRole('alert').last()).toContainText('نافذة');
  expect(api.writes).toHaveLength(0);
});
async function prepareReturn(page: Page) {
  const api = await setup(page, 'ManagementEmployee', true);
  api.state.order.status = 'Printed Confirmed';
  Object.assign(api.state.order, {
    oliveryStatus: 'delivered_with_return',
    isReturnProcessed: false,
  });
  Object.assign(api.state.order.items[0], { orderItemId: 44, merchantProfitUSD: 6 });
  await page.getByRole('button', { name: /^تحديث حالة (التوصيل|زحل)$/ }).click();
  await page.getByRole('button', { name: 'معالجة المرتجع الجزئي', exact: true }).click();
  await page.getByRole('checkbox', { name: 'إرجاع البند 44', exact: true }).click();
  return api;
}
test('external partial return validates quantities, reviews once and displays returned quantities', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const api = await prepareReturn(page);
  await page.getByLabel('الكمية المرتجعة للبند 44', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'مراجعة الكميات', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('الكمية');
  await page.getByLabel('الكمية المرتجعة للبند 44', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'مراجعة الكميات', exact: true }).click();
  await page.screenshot({
    path: 'test-results/external-return-review.png',
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'تأكيد معالجة المرتجع', exact: true }).click();
  await expect(page.getByText('تم تسجيل المرتجع الخارجي', { exact: true })).toBeVisible();
  expect(api.writes).toEqual([
    { method: 'POST', body: { items: [{ orderItemId: 44, quantity: 1 }] } },
  ]);
  expect(api.state.order.status).toBe('Printed Confirmed');
  await expect(page.getByText('الكمية المرتجعة: 1', { exact: true }).last()).toBeVisible();
});
test('external partial return rechecks live eligibility and does not write after tracking changes', async ({
  page,
}) => {
  const api = await prepareReturn(page);
  api.state.syncStatus = 'delivered';
  await page.getByRole('button', { name: 'مراجعة الكميات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد معالجة المرتجع', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('مرتجع جزئي');
  expect(api.writes).toHaveLength(0);
});
test('ambiguous external return blocks repeat POST until explicit negative verification', async ({
  page,
}) => {
  const api = await prepareReturn(page);
  api.state.lostReturn = true;
  await page.getByRole('button', { name: 'مراجعة الكميات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد معالجة المرتجع', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'مراجعة الكميات', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'التحقق من نتيجة المرتجع', exact: true }).click();
  await expect(page.getByRole('button', { name: 'مراجعة الكميات', exact: true })).toBeEnabled();
  expect(api.writes).toHaveLength(1);
});

test('external assigned management saves valid edits and preserves provider type', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', true);
  await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'العنوان التفصيلي *', exact: true })
    .fill('عنوان جديد في حلب');
  await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
  await expect(page.getByText('تم حفظ تعديلات الطلب بنجاح', { exact: true })).toBeVisible();
  expect(api.writes[0].method).toBe('PUT');
  expect(api.writes[0].body.customerArea).toBe('حلب');
});
test('external provider rejection preserves local status and retained notes', async ({ page }) => {
  const api = await setup(page, 'Merchant', true);
  api.state.order.status = 'Confirmed';
  api.state.failSave = true;
  await page.getByRole('button', { name: 'تحديث حالة الطلب', exact: true }).click();
  await page.getByRole('radio', { name: 'ملغي', exact: true }).click();
  await page.getByRole('textbox', { name: 'ملاحظات تغيير الحالة' }).fill('طلب العميل الإلغاء');
  await saveStatus(page);
  await expect(page.getByRole('alert')).toBeVisible();
  expect(api.state.order.status).toBe('Confirmed');
  await expect(page.getByRole('textbox', { name: 'ملاحظات تغيير الحالة' })).toHaveValue(
    'طلب العميل الإلغاء',
  );
  expect(api.writes).toHaveLength(1);
});

for (const role of ['Merchant', 'SalesEmployee', 'DeliveryAgent'] as const)
  test(`${role}: direct edit URL cannot open the editor`, async ({ page }) => {
    const api = await setup(page, role);
    await navigate(page, `/${paths[role]}/edit-order?id=21`);
    await expect(page.getByRole('alert')).toHaveText('تعديل بيانات الطلب متاح لموظف الإدارة فقط.');
    await expect(page.getByRole('textbox')).toHaveCount(0);
    expect(api.writes).toHaveLength(0);
  });
test('return details cannot be edited even by assigned management', async ({ page }) => {
  const api = await setup(page, 'ManagementEmployee');
  api.state.order.orderType = 'Return';
  await navigate(page, '/management-employee/edit-order?id=21');
  await expect(
    page.getByText('بيانات طلب المرتجع للعرض فقط. استخدم إجراءات المرتجع لمتابعته.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'مراجعة التعديلات', exact: true })).toBeDisabled();
  expect(api.writes).toHaveLength(0);
});

for (const external of [false, true])
  test(`management saves ${external ? 'external' : 'internal'} edit without assignment`, async ({
    page,
  }) => {
    const api = await setup(page, 'ManagementEmployee', external);
    Reflect.deleteProperty(api.state.order, 'assignedToEmployeeId');
    await page.getByRole('button', { name: 'تعديل الطلب', exact: true }).click();
    await page.getByRole('textbox', { name: 'لون المنتج 1', exact: true }).fill('أزرق');
    await page.getByRole('button', { name: 'مراجعة التعديلات', exact: true }).click();
    await page.getByRole('button', { name: 'تأكيد وحفظ التعديلات', exact: true }).click();
    await expect(page.getByText('تم حفظ تعديلات الطلب بنجاح', { exact: true })).toBeVisible();
    expect(api.writes).toHaveLength(1);
    expect(api.writes[0].method).toBe('PUT');
  });

test('external uncertain receipt survives reload with missing processed flag', async ({ page }) => {
  const api = await prepareReturn(page);
  api.state.lostReturn = true;
  Reflect.deleteProperty(api.state.order, 'isReturnProcessed');
  await page.getByRole('button', { name: 'مراجعة الكميات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد معالجة المرتجع', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.reload();
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page).toHaveURL(/management-employee$/);
  await navigate(page, '/management-employee/external-return?id=21');
  await expect(
    page.getByRole('button', { name: 'التحقق من نتيجة المرتجع', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'مراجعة الكميات', exact: true })).toBeDisabled();
  expect(api.writes).toHaveLength(1);
});

test('external screen synchronizes stale tracking and ignores missing assignment', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', true);
  Reflect.deleteProperty(api.state.order, 'assignedToEmployeeId');
  Object.assign(api.state.order.items[0], { orderItemId: 44 });
  Object.assign(api.state.order, { oliveryStatus: 'delivered', isCredited: true });
  api.state.syncStatus = 'delivered_with_return';
  await page.getByRole('button', { name: 'معالجة المرتجع الجزئي', exact: true }).click();
  await page.getByRole('checkbox', { name: 'إرجاع البند 44', exact: true }).click();
  await page.getByRole('button', { name: 'مراجعة الكميات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد معالجة المرتجع', exact: true }).click();
  await expect(page.getByText('تم تسجيل المرتجع الخارجي', { exact: true })).toBeVisible();
  expect(api.writes).toHaveLength(1);
});

test('external return cannot submit when live order is explicitly not credited', async ({
  page,
}) => {
  const api = await prepareReturn(page);
  Object.assign(api.state.order, { isCredited: false });
  await page.getByRole('button', { name: 'مراجعة الكميات', exact: true }).click();
  await page.getByRole('button', { name: 'تأكيد معالجة المرتجع', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('الرصيد');
  expect(api.writes).toHaveLength(0);
});

test('live tracking displays Arabic titles and verified effects without changing local status', async ({
  page,
}) => {
  const api = await setup(page, 'ManagementEmployee', true);
  Object.assign(api.state.order, {
    status: 'Printed Confirmed',
    oliveryStatus: 'تم استلام الشحنة من التاجر',
    isCredited: true,
    isRestocked: true,
    isFeeDebited: false,
  });
  await page.getByRole('button', { name: 'تحديث حالة زحل', exact: true }).click();
  await expect(page.getByText(/آخر تحديث ناجح:/)).toBeVisible();
  await expect(page.getByText('أكد الخادم إضافة أرصدة الطلب.', { exact: true })).toBeVisible();
  await expect(page.getByText('أكد الخادم إعادة المخزون.', { exact: true })).toBeVisible();
  await expect(page.getByText('أكد الخادم خصم رسوم التوصيل.', { exact: true })).toHaveCount(0);
  expect(api.writes).toHaveLength(0);
  expect(api.state.order.status).toBe('Printed Confirmed');
  await page.getByText('متابعة الشحنة · زحل', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/olivery-tracking.png' });
});
