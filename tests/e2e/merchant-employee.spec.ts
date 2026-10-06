import { test, expect } from '@playwright/test';
for (const fail of [false, true])
  test(`employee creation preserves merchant session; rejection=${fail}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const user = {
      userId: 7,
      role: 'Merchant',
      accountStatus: 'Approved',
      firstName: 'التاجر',
      dollarBalance: 100,
    };
    const posts: unknown[] = [];
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname.split('/api/')[1];
      if (path === 'user/merchant-employee') {
        expect(route.request().headers().authorization).toBe('Bearer merchant-token');
        posts.push(route.request().postDataJSON());
        return route.fulfill({
          status: fail ? 409 : 200,
          json: fail
            ? { message: 'البريد مستخدم بالفعل' }
            : { isSuccess: true, data: { userId: 88, token: 'employee-token' } },
        });
      }
      return route.fulfill({
        json: {
          data:
            path === 'Auth/login'
              ? { user, token: 'merchant-token' }
              : path === 'User/7'
                ? user
                : [],
        },
      });
    });
    await page.goto('/login');
    await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('merchant@example.com');
    await page.getByPlaceholder('أدخل كلمة المرور').fill('password');
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
    await page.getByRole('tab', { name: /حسابي/ }).click();
    await page.getByRole('button', { name: 'إضافة موظف', exact: true }).click();
    await page.getByLabel('الاسم الأول', { exact: true }).fill('أحمد');
    await page.getByLabel('اسم العائلة', { exact: true }).fill('علي');
    await page.getByLabel('البريد الإلكتروني', { exact: true }).fill('employee@example.com');
    await page.getByLabel('كلمة المرور', { exact: true }).fill('employee-password');
    await page.getByLabel('تأكيد كلمة المرور', { exact: true }).fill('different');
    await page.getByRole('button', { name: 'إنشاء حساب الموظف', exact: true }).click();
    await expect(page.getByText('كلمتا المرور غير متطابقتين')).toBeVisible();
    expect(posts).toHaveLength(0);
    await page.getByLabel('تأكيد كلمة المرور', { exact: true }).fill('employee-password');
    await page.getByRole('button', { name: 'إنشاء حساب الموظف', exact: true }).click();
    await expect.poll(() => posts.length).toBe(1);
    expect(posts[0]).toEqual({
      firstName: 'أحمد',
      lastName: 'علي',
      email: 'employee@example.com',
      password: 'employee-password',
    });
    if (fail) {
      await expect(page.getByText('البريد مستخدم بالفعل')).toBeVisible();
      await expect(page.getByLabel('البريد الإلكتروني', { exact: true })).toHaveValue(
        'employee@example.com',
      );
    } else {
      await expect(page.getByText('تم إنشاء حساب الموظف', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'العودة إلى حسابي' }).click();
      await expect(page.getByText('رقم الحساب #7', { exact: true })).toBeVisible();
    }
  });
