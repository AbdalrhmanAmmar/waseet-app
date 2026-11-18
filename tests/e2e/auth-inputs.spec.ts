import { expect, test, type Page } from '@playwright/test';
async function personal(page: Page) {
  await page.getByLabel('الاسم الأول', { exact: true }).fill('أحمد');
  await page.getByLabel('الاسم الثاني', { exact: true }).fill('محمد');
  await page.getByLabel('اسم العائلة', { exact: true }).fill('خالد');
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
}
async function contact(page: Page) {
  await page.getByLabel('البريد الإلكتروني', { exact: true }).fill('ahmad@example.com');
  await page.getByLabel('رقم الهاتف', { exact: true }).fill('٩٤٤ ١٢٣ ٤٥٦');
  await page.getByLabel('العنوان بالتفصيل', { exact: true }).fill('دمشق، المزة، شارع الفيلات');
}
test('auth fields validate after interaction and preserve direction, focus and cursor when revealing a password', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/login');
  const email = page.getByLabel('البريد الإلكتروني', { exact: true });
  const password = page.getByLabel('كلمة المرور', { exact: true });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(email).toHaveCSS('direction', 'ltr');
  await email.fill('ahmad@');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await password.focus();
  await expect(page.getByRole('alert')).toHaveText('اكتب البريد بهذا الشكل: name@example.com');
  await email.fill('ahmad@example.com');
  await expect(email).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByText('اكتب البريد بهذا الشكل: name@example.com')).toHaveCount(0);
  await password.fill('test-password');
  await password.press('Home');
  await password.press('ArrowRight');
  await password.press('ArrowRight');
  await page.getByRole('button', { name: 'إظهار كلمة المرور', exact: true }).click();
  await expect(password).toBeFocused();
  await expect(password).toHaveJSProperty('type', 'text');
  await expect(password).toHaveCSS('direction', 'ltr');
  await expect
    .poll(() => password.evaluate((element: HTMLInputElement) => element.selectionStart))
    .toBe(2);
  await page.getByRole('button', { name: 'إخفاء كلمة المرور', exact: true }).click();
  await expect(password).toHaveValue('test-password');
  await expect(password).toHaveAttribute('type', 'password');
  await expect(password).toHaveCSS('direction', 'ltr');
  expect(errors).toEqual([]);
});
test('phone country and residence stay independent, international paste is normalized once and server failure preserves the form', async ({
  page,
}) => {
  const posts: Record<string, unknown>[] = [];
  await page.route('**/api/**', async (route) => {
    if (route.request().url().includes('Auth/register')) {
      posts.push(route.request().postDataJSON());
      return route.fulfill({ status: 400, json: { message: 'البريد مسجل بالفعل' } });
    }
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto('/register');
  await personal(page);
  await contact(page);
  await page.getByRole('button', { name: 'بلد الإقامة: سوريا', exact: true }).click();
  await page.getByLabel('البحث عن دولة').fill('ألمانيا');
  await page.getByRole('button', { name: 'ألمانيا (+49)', exact: true }).click();
  await expect(page.getByLabel('البحث عن دولة')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'كود دولة رقم الهاتف: +963', exact: true }),
  ).toBeVisible();
  const phone = page.getByLabel('رقم الهاتف', { exact: true });
  await phone.fill('+٢٠ ١٠١٢٣٤٥٦٧٨');
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('كود الرقم مختلف');
  await expect(phone).toBeFocused();
  await page.getByRole('button', { name: 'كود دولة رقم الهاتف: +963', exact: true }).click();
  await page.getByLabel('البحث عن دولة').fill('مصر');
  await page.getByRole('button', { name: 'مصر (+20)', exact: true }).click();
  await expect(page.getByLabel('البحث عن دولة')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'بلد الإقامة: ألمانيا', exact: true }),
  ).toBeVisible();
  await expect(phone).toHaveValue('+٢٠ ١٠١٢٣٤٥٦٧٨');
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await page.getByLabel('كلمة المرور', { exact: true }).fill('test-password');
  await page.getByLabel('تأكيد كلمة المرور', { exact: true }).fill('test-password');
  await expect(page.getByText('كلمتا المرور متطابقتان', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('البريد مسجل بالفعل');
  expect(posts).toHaveLength(1);
  expect(posts[0]).toMatchObject({
    phoneNumber: '+201012345678',
    country: 'ألمانيا',
    role: 'Merchant',
  });
  expect(posts[0]).not.toHaveProperty('confirmPassword');
  await page.getByRole('button', { name: 'السابق', exact: true }).click();
  await expect(phone).toHaveValue('+٢٠ ١٠١٢٣٤٥٦٧٨');
  await expect(
    page.getByRole('button', { name: 'بلد الإقامة: ألمانيا', exact: true }),
  ).toBeVisible();
});
test('signup disables edits and repeated submissions while awaiting registration and retains passwords on rejection', async ({
  page,
}) => {
  let count = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/**', async (route) => {
    if (!route.request().url().includes('Auth/register'))
      return route.fulfill({ json: { data: [] } });
    count++;
    await pending;
    return route.fulfill({ status: 400, json: { message: 'راجع بيانات الحساب' } });
  });
  await page.goto('/register');
  await personal(page);
  await contact(page);
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  const password = page.getByLabel('كلمة المرور', { exact: true });
  const confirmation = page.getByLabel('تأكيد كلمة المرور', { exact: true });
  await password.fill('test-password');
  await password.press('Enter');
  await expect(confirmation).toBeFocused();
  await confirmation.fill('test-password');
  const send = page.getByRole('button', { name: 'إنشاء الحساب', exact: true });
  try {
    await confirmation.press('Enter');
    await expect(send).toBeDisabled();
    await expect(password).not.toBeEditable();
    await expect(
      page.getByRole('button', { name: 'إظهار كلمة المرور', exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole('button', { name: 'السابق', exact: true })).toBeDisabled();
    await send.dispatchEvent('click');
    await expect.poll(() => count).toBe(1);
  } finally {
    release();
  }
  await expect(page.getByRole('alert')).toHaveText('راجع بيانات الحساب');
  await expect(password).toHaveValue('test-password');
  await expect(confirmation).toHaveValue('test-password');
  await expect(send).toBeEnabled();
});
test('auth screens fit 320px and preserve all signup fields through backward navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route('**/api/**', (route) => route.fulfill({ json: { data: [] } }));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/register');
  await page.screenshot({ path: 'test-results/auth-signup-personal-320.png', fullPage: true });
  await personal(page);
  await contact(page);
  await page.getByLabel('رقم الهاتف', { exact: true }).focus();
  await page.setViewportSize({ width: 320, height: 420 });
  await expect(page.getByLabel('رقم الهاتف', { exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.getByRole('button', { name: 'متابعة', exact: true }).click();
  await page.getByLabel('كلمة المرور', { exact: true }).fill('test-password');
  await page.getByLabel('تأكيد كلمة المرور', { exact: true }).fill('different');
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await expect(page.getByLabel('تأكيد كلمة المرور', { exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toHaveText('كلمات المرور غير متطابقة');
  await page.getByRole('button', { name: 'السابق', exact: true }).click();
  await expect(page.getByLabel('رقم الهاتف', { exact: true })).toHaveValue('٩٤٤ ١٢٣ ٤٥٦');
  await page.getByRole('button', { name: 'السابق', exact: true }).click();
  await expect(page.getByLabel('الاسم الأول', { exact: true })).toHaveValue('أحمد');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
