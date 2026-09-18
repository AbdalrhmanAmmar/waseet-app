import { test, expect } from '@playwright/test';

test('login design fits phones and tablet, hides password reset and opens registration', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'أهلًا بعودتك', exact: true })).toBeVisible();
  await expect(page.getByText(/نسيت كلمة المرور/)).toHaveCount(0);
  await expect(page.getByRole('tablist')).toHaveCount(0);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 640 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByPlaceholder('أدخل بريدك الإلكتروني')).toBeVisible();
    await page
      .getByRole('button', { name: 'إنشاء حساب جديد', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('button', { name: 'إنشاء حساب جديد', exact: true }),
    ).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    // Capture the top of the actual scrollable screen, including its unmodified brand asset.
    await page.getByTestId('login-content').evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.screenshot({
      path: `test-results/login-${viewport.width}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.getByRole('button', { name: 'إنشاء حساب جديد', exact: true }).click();
  await expect(page).toHaveURL(/\/register(?:\?|$)/);
});

test('login validates locally, moves focus, toggles password and prevents resubmission while awaiting the API', async ({
  page,
}) => {
  let calls = 0;
  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/**', async (route) => {
    if (route.request().url().includes('Auth/login')) {
      calls++;
      await response;
      await route.fulfill({
        status: 401,
        json: { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' },
      });
    } else await route.fulfill({ json: { data: [] } });
  });
  await page.goto('/login');
  const email = page.getByPlaceholder('أدخل بريدك الإلكتروني');
  const password = page.getByPlaceholder('أدخل كلمة المرور');
  const login = page.getByRole('button', { name: 'تسجيل الدخول', exact: true });
  await login.click();
  await expect(page.getByRole('alert')).toHaveCount(2);
  await expect(email).toBeFocused();
  expect(calls).toBe(0);
  await email.fill('invalid');
  await expect(page.getByText('بريد إلكتروني غير صالح', { exact: true })).toBeVisible();
  await email.fill('test@example.com');
  await email.press('Enter');
  await expect(password).toBeFocused();
  await password.fill('test-password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'إظهار كلمة المرور', exact: true }).click();
  await expect(password).toHaveJSProperty('type', 'text');
  await expect(password).toHaveValue('test-password');
  await page.getByRole('button', { name: 'إخفاء كلمة المرور', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  try {
    await password.press('Enter');
    await expect(login).toBeDisabled();
    await expect(page.getByText('جارٍ تسجيل الدخول…', { exact: true })).toBeVisible();
    await expect(email).not.toBeEditable();
    await expect(page.getByRole('button', { name: 'إنشاء حساب جديد', exact: true })).toBeDisabled();
    await login.dispatchEvent('click');
    await expect.poll(() => calls).toBe(1);
  } finally {
    release();
  }
  await expect(page.getByRole('alert')).toHaveText('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  await expect(login).toBeEnabled();
  await expect(email).toHaveValue('test@example.com');
  await password.fill('new-password');
  await expect(page.getByRole('alert')).toHaveCount(0);
  // A short viewport simulates the usable area when a keyboard is present.
  await page.setViewportSize({ width: 320, height: 400 });
  await login.scrollIntoViewIfNeeded();
  await expect(login).toBeInViewport();
});
