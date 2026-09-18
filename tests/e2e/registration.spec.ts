import { test, expect, type Page } from '@playwright/test';
async function personal(page: Page) {
  await page.getByPlaceholder('الاسم الأول', { exact: true }).fill('أحمد');
  await page.getByPlaceholder('الاسم الثاني', { exact: true }).fill('محمد');
  await page.getByPlaceholder('اسم العائلة', { exact: true }).fill('علي');
  await page.getByRole('button', { name: 'اختيار تاريخ الميلاد' }).click();
  await page.getByLabel('السنة', { exact: true }).selectOption('2000');
  await page.getByLabel('الشهر', { exact: true }).selectOption('2');
  await page.getByLabel('اليوم', { exact: true }).selectOption('29');
  await page.getByRole('button', { name: 'تأكيد التاريخ' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
}
async function contact(page: Page) {
  await page.getByPlaceholder('example@mail.com').fill('test@example.com');
  await page.getByPlaceholder('أدخل رقم الهاتف', { exact: true }).fill('912345678');
  await page.getByPlaceholder('المنطقة، الشارع، البناء').fill('عنوان اختبار');
}
test('registration validates steps, preserves fields, retries failure and submits without Olivery', async ({
  page,
}) => {
  let payload: Record<string, unknown> | undefined;
  let calls = 0;
  await page.route('**/api/**', async (route) => {
    if (!route.request().url().includes('Auth/register'))
      return route.fulfill({ json: { isSuccess: true, data: [] } });
    calls++;
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: calls === 1 ? 400 : 200,
      json: calls === 1 ? { message: 'البريد مسجل بالفعل' } : { isSuccess: true, data: {} },
    });
  });
  await page.goto('/register');
  await expect(page.getByText('اختر تاريخ ميلادك', { exact: true })).toBeVisible();
  await page.screenshot({
    path: 'test-results/signup-personal.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await expect(page.getByText('الاسم الأول مطلوب', { exact: true })).toBeVisible();
  await expect(page.getByText('تاريخ الميلاد مطلوب', { exact: true })).toBeVisible();
  await personal(page);
  await contact(page);
  await expect(page.getByText(/أوليفر|Olivery/i)).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/signup-contact.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'السابق', exact: true }).click();
  await expect(page.getByPlaceholder('الاسم الأول', { exact: true })).toHaveValue('أحمد');
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await expect(page.getByPlaceholder('example@mail.com')).toHaveValue('test@example.com');
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await page.getByPlaceholder('8 أحرف على الأقل').fill('test-password');
  await page.getByPlaceholder('أعد كتابة كلمة المرور').fill('different-password');
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await expect(page.getByText('كلمات المرور غير متطابقة', { exact: true })).toBeVisible();
  expect(calls).toBe(0);
  await page.getByPlaceholder('أعد كتابة كلمة المرور').fill('test-password');
  await page.screenshot({
    path: 'test-results/signup-confirm.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await expect(page.getByText('البريد مسجل بالفعل', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('8 أحرف على الأقل')).toHaveValue('test-password');
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await expect(page.getByText('أهلًا بك في وسيط', { exact: true })).toBeVisible();
  expect(calls).toBe(2);
  expect(payload).toEqual({
    firstName: 'أحمد',
    secondName: 'محمد',
    lastName: 'علي',
    email: 'test@example.com',
    phoneNumber: '+963912345678',
    country: 'سوريا',
    address: 'عنوان اختبار',
    birthDate: '2000-02-29T00:00:00.000Z',
    password: 'test-password',
    role: 'Merchant',
  });
});
test('delivery signup requires city and refuses impossible calendar dates', async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      json: { isSuccess: true, data: [{ deliveryAreaId: 1, city: 'دمشق', fee: 3 }] },
    }),
  );
  await page.goto('/register');
  await page.getByRole('radio', { name: 'مندوب توصيل', exact: true }).click();
  await page.getByRole('button', { name: 'اختيار تاريخ الميلاد' }).click();
  await page.getByLabel('السنة', { exact: true }).selectOption('2001');
  await page.getByLabel('الشهر', { exact: true }).selectOption('2');
  await page.getByLabel('اليوم', { exact: true }).selectOption('31');
  await page.getByRole('button', { name: 'تأكيد التاريخ' }).click();
  await expect(
    page.getByText('التاريخ غير صحيح أو يقع في المستقبل. راجع اليوم والشهر والسنة.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'إلغاء', exact: true }).click();
  await personal(page);
  await contact(page);
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await expect(page.getByText('اختر مدينة التوصيل أو أدخل اسمها')).toBeVisible();
  await page.getByRole('button', { name: 'دمشق', exact: true }).click();
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await expect(page.getByPlaceholder('8 أحرف على الأقل')).toBeVisible();
});
test('login design remains usable on a narrow phone and shows server errors', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 401, json: { message: 'بيانات الدخول غير صحيحة' } }),
  );
  await page.goto('/login');
  await expect(page.getByPlaceholder('أدخل بريدك الإلكتروني')).toBeVisible();
  await page.screenshot({ path: 'test-results/login.png', fullPage: true, animations: 'disabled' });
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('wrong-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByText('بيانات الدخول غير صحيحة', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: 'test-results/login-small.png',
    fullPage: true,
    animations: 'disabled',
  });
});
