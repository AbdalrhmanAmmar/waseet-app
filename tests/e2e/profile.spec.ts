import { test, expect } from '@playwright/test';
const roles = {
  Merchant: 'merchant',
  SalesEmployee: 'sales-employee',
  ManagementEmployee: 'management-employee',
  DeliveryAgent: 'delivery-agent',
};
for (const [role, path] of Object.entries(roles)) {
  test(`${role}: profile opens without menu, survives rejected refresh and repeated tab switches`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const user = {
      userId: 7,
      role,
      firstName: 'حساب',
      lastName: 'اختبار',
      accountStatus: 'Approved',
      email: 'profile@example.com',
      dollarBalance: 10,
    };
    let rejectProfile = false;
    await page.route('**/api/**', async (route) => {
      const apiPath = new URL(route.request().url()).pathname.split('/api/')[1];
      let data: unknown = [];
      if (apiPath === 'Auth/login') data = { user, token: 'test-session' };
      else if (apiPath === 'User/7') {
        if (rejectProfile) return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
        data = user;
      } else if (apiPath.startsWith('orders'))
        data = { items: [], page: 1, totalPages: 1, totalCount: 0 };
      await route.fulfill({ json: { isSuccess: true, data } });
    });
    await page.goto('/login');
    await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('profile@example.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${path}$`));
    for (let i = 0; i < 3; i++) {
      rejectProfile = i > 0;
      await page.getByRole('tab', { name: /حسابي/ }).click();
      await expect(page).toHaveURL(new RegExp(`/${path}/profile$`));
      await expect(
        page.getByRole('button', { name: 'تعديل الملف الشخصي', exact: true }),
      ).toBeVisible();
      await expect(page.getByText('حساب اختبار', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'فتح القائمة', exact: true })).toHaveCount(0);
      await page.waitForTimeout(200);
      if (i === 2)
        await page.screenshot({
          path: `test-results/profile-${role}.png`,
          animations: 'disabled',
          fullPage: true,
        });
      await page
        .getByRole('tab', {
          name: role === 'Merchant' || role === 'SalesEmployee' ? /الرئيسية/ : /الطلبات/,
        })
        .click();
    }
    expect(errors).toEqual([]);
  });
}
