import { test, expect } from '@playwright/test';
for (const role of [
  'Merchant',
  'MerchantEmployee',
  'SalesEmployee',
  'ManagementEmployee',
  'DeliveryAgent',
]) {
  test(`${role} deletes only own account after confirmation and clears session`, async ({
    page,
  }) => {
    const user = {
      userId: 7,
      ownerMerchantId: 99,
      role,
      accountStatus: 'Approved',
      firstName: 'Test',
      email: 'test@example.com',
    };
    let deletes = 0;
    await page.route('**/api/**', async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname.split('/api/')[1];
      if (req.method() === 'DELETE') {
        expect(path).toBe('User/7');
        expect(req.headers().authorization).toBe('Bearer test-token');
        deletes++;
        return route.fulfill({ status: 204 });
      }
      const data =
        path === 'Auth/login'
          ? { user, token: 'test-token' }
          : path === 'User/7'
            ? user
            : path === 'orders' || path === 'orders/my-deliveries'
              ? { items: [], totalCount: 0, page: 1, totalPages: 1 }
              : [];
      await route.fulfill({ json: { isSuccess: true, data } });
    });
    await page.goto('/login');
    await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await page.getByRole('tab', { name: /حسابي/ }).click();
    await page.getByRole('button', { name: 'حذف حسابي', exact: true }).click();
    if (role === 'Merchant') {
      await expect(page.getByRole('button', { name: 'تأكيد حذف حسابي', exact: true })).toBeVisible();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/delete-account-confirm.png' });
    }
    expect(deletes).toBe(0);
    await page.getByRole('button', { name: 'إلغاء والاحتفاظ بحسابي' }).click();
    expect(deletes).toBe(0);
    await page.getByRole('button', { name: 'حذف حسابي', exact: true }).click();
    await page.getByRole('button', { name: 'تأكيد حذف حسابي', exact: true }).click();
    await expect(page).toHaveURL(/\/(login|onboarding)$/);
    expect(deletes).toBe(1);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('waseet.session.user')))
      .toBeNull();
    await page.reload();
    await expect(page).toHaveURL(/\/(login|onboarding)$/);
  });
}
for (const rejection of [403, 200, 503]) {
  test(`restricted account can request deletion; rejection ${rejection} never reports success`, async ({
    page,
  }) => {
    const user = { userId: 7, role: 'Merchant', accountStatus: 'Pending' };
    let deletes = 0;
    await page.route('**/api/**', async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname.split('/api/')[1];
      if (req.method() === 'DELETE') {
        deletes++;
        return route.fulfill({
          status: rejection,
          json: { isSuccess: false, message: 'Cannot delete account with active orders' },
        });
      }
      await route.fulfill({
        json: {
          isSuccess: true,
          data: path === 'Auth/login' ? { user, token: 'test-token' } : user,
        },
      });
    });
    await page.goto('/login');
    await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await expect(page).toHaveURL(/account-status$/);
    await page.getByRole('button', { name: 'حذف حسابي', exact: true }).click();
    await page.getByRole('button', { name: 'تأكيد حذف حسابي', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(deletes).toBe(1);
    await expect(page).toHaveURL(/account-status$/);
    await page.getByRole('button', { name: 'إلغاء والاحتفاظ بحسابي' }).click();
    await expect(page.getByRole('button', { name: 'حذف حسابي', exact: true })).toBeVisible();
  });
}
