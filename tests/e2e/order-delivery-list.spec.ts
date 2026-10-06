import { test, expect } from '@playwright/test';
for (const role of ['Merchant', 'SalesEmployee', 'ManagementEmployee', 'DeliveryAgent']) {
  test(`${role}: delivery types, independent statuses and multi-select filters`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const user = {
      userId: 7,
      role,
      accountStatus: 'Approved',
      firstName: 'أحمد',
      dollarBalance: 10,
    };
    const common = {
      customerName: 'عميل تجريبي',
      customerArea: 'دمشق',
      customerMobile: '0991234567',
      items: [],
      orderTotalUSD: 45,
    };
    const orders = [
      { ...common, orderId: 101, deliveryMode: 'internal', status: 'Ready for Dispatch' },
      {
        ...common,
        orderId: 102,
        deliveryMode: 'external',
        status: 'Printed Confirmed',
        oliveryStatus: 'تم التسليم ويوجد مرتجع',
        deliveryStatus: null,
      },
      {
        ...common,
        orderId: 103,
        deliveryMode: 'external',
        status: 'Confirmed',
        oliveryStatus: 'بالانتظار',
      },
    ];
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.split('/api/')[1];
      const data =
        path === 'Auth/login'
          ? { user, token: 'test' }
          : path === 'User/7'
            ? user
            : path === 'orders/statuses'
              ? []
              : path.startsWith('orders')
                ? { items: orders, page: 1, totalPages: 1, totalCount: 3 }
                : [];
      await route.fulfill({ json: { isSuccess: true, data } });
    });
    await page.goto('/login');
    await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await page.getByRole('tab', { name: /الطلبات/ }).click();
    await page.getByRole('button', { name: 'نوع التوصيل حالة زحل', exact: true }).click();
    await expect(page.getByRole('button', { name: 'فتح طلب #101', exact: true })).toHaveCount(0);
    await expect(page.getByText('تم التسليم مع إرجاع جزئي', { exact: true })).toBeVisible();
    const externalCard = page.getByRole('button', { name: 'فتح طلب #102', exact: true });
    for (const label of [
      'حالة الطلب',
      'حالة زحل',
      'حالة التوصيل',
      'لا توجد حالة توصيل منفصلة لهذه المرحلة',
    ])
      await expect(externalCard.getByText(label, { exact: true }).last()).toBeVisible();
    await expect(
      page
        .getByRole('button', { name: 'فتح طلب #102', exact: true })
        .getByText('مطبوع مؤكد', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'فلترة الحالات', exact: true }).click();
    await page.getByLabel('البحث في الحالات').fill('إرجاع جزئي');
    await page
      .getByRole('checkbox', { name: 'حالة زحل: تم التسليم مع إرجاع جزئي', exact: true })
      .click();
    await page.getByRole('button', { name: 'عرض النتائج', exact: true }).click();
    await expect(page.getByRole('button', { name: 'فتح طلب #103', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'نوع التوصيل داخلي', exact: true }).click();
    await expect(page.getByRole('button', { name: 'فتح طلب #101', exact: true })).toBeVisible();
    await expect(
      page
        .getByRole('button', { name: 'فتح طلب #101', exact: true })
        .getByText('جاهز للتوصيل', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'فلترة الحالات', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.waitForTimeout(400);
    await page.screenshot({ path: `test-results/order-types-${role}.png`, fullPage: true });
  });
}
