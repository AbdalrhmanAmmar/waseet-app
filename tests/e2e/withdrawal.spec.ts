import { test, expect, type Page } from '@playwright/test';
async function setup(page: Page, failure = 0) {
  const user = {
    userId: 7,
    role: 'Merchant',
    accountStatus: 'Approved',
    firstName: 'أحمد',
    dollarBalance: 150.75,
  };
  const posts: unknown[] = [];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.split('/api/')[1];
    if (path === 'Auth/login') return route.fulfill({ json: { data: { user, token: 'test' } } });
    if (path === 'User/7') return route.fulfill({ json: { data: user } });
    if (path === 'withdrawal-requests') {
      expect(route.request().headers().authorization).toBe('Bearer test');
      posts.push(route.request().postDataJSON());
      await new Promise((resolve) => setTimeout(resolve, 300));
      return route.fulfill({
        status: failure || 200,
        json: failure ? { message: 'رفض الخادم الطلب' } : { isSuccess: true },
      });
    }
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await page.getByRole('button', { name: 'طلب سحب', exact: true }).click();
  await expect(page.getByText('اطلب سحب رصيدك', { exact: true })).toBeVisible();
  return { user, posts };
}
test('merchant withdrawal validates, reviews Arabic amount and sends only requested body once', async ({
  page,
}) => {
  const { posts } = await setup(page);
  await page.screenshot({ path: 'test-results/withdrawal-top.png', fullPage: true });
  const amount = page.getByLabel('مبلغ السحب');
  const review = page.getByRole('button', { name: 'مراجعة طلب السحب', exact: true });
  await amount.fill('0');
  await expect(review).toBeDisabled();
  await amount.fill('150.76');
  await expect(review).toBeDisabled();
  await amount.fill('٥٠٫٢٥');
  await page.getByLabel('ملاحظة طلب السحب').fill('طلب سحب تجريبي');
  await page.screenshot({ path: 'test-results/withdrawal-form.png', fullPage: true });
  await review.click();
  await expect(page.getByText('راجع طلب السحب', { exact: true })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/withdrawal-review.png', fullPage: true });
  const confirm = page.getByRole('button', { name: 'تأكيد وإرسال الطلب' });
  await confirm.click();
  await expect(confirm).toBeDisabled();
  await expect(page.getByText('تم إرسال طلب السحب', { exact: true })).toBeVisible();
  expect(posts).toEqual([{ amount: 50.25, note: 'طلب سحب تجريبي' }]);
});
test('latest balance prevents POST after balance changes during review', async ({ page }) => {
  const { user, posts } = await setup(page);
  await page.getByRole('button', { name: 'سحب كامل الرصيد' }).click();
  await page.getByLabel('ملاحظة طلب السحب').fill('سحب الرصيد');
  await page.getByRole('button', { name: 'مراجعة طلب السحب' }).click();
  user.dollarBalance = 10;
  await page.getByRole('button', { name: 'تأكيد وإرسال الطلب' }).click();
  await expect(page.getByText('المبلغ المطلوب أكبر من رصيد حسابك').first()).toBeVisible();
  expect(posts).toEqual([]);
});
test('uncertain submission blocks a repeated request across navigation', async ({ page }) => {
  const { posts } = await setup(page, 503);
  await page.getByLabel('مبلغ السحب').fill('20');
  await page.getByLabel('ملاحظة طلب السحب').fill('طلب سحب');
  await page.getByRole('button', { name: 'مراجعة طلب السحب' }).click();
  await page.getByRole('button', { name: 'تأكيد وإرسال الطلب' }).click();
  await expect(page.getByRole('button', { name: 'التواصل مع الدعم' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'مراجعة طلب السحب' })).toBeDisabled();
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('button', { name: 'طلب سحب', exact: true }).click();
  await expect(page.getByRole('button', { name: 'التواصل مع الدعم' })).toBeVisible();
  expect(posts).toHaveLength(1);
});

test('withdrawal requires a note and shows the validation message in Arabic', async ({ page }) => {
  const { posts } = await setup(page);
  await page.getByLabel('مبلغ السحب').fill('20');
  const note = page.getByLabel('ملاحظة طلب السحب');
  await note.fill(' ');
  await note.blur();
  await expect(page.getByText('ملاحظة طلب السحب مطلوبة', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'مراجعة طلب السحب' })).toBeDisabled();
  expect(posts).toEqual([]);
});
test('server rejection preserves form at narrow width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await setup(page, 403);
  await page.getByLabel('مبلغ السحب').fill('20');
  await page.getByLabel('ملاحظة طلب السحب').fill('ملاحظة محفوظة');
  await page.getByRole('button', { name: 'مراجعة طلب السحب' }).click();
  await page.getByRole('button', { name: 'تأكيد وإرسال الطلب' }).click();
  await expect(page.getByText('رفض الخادم الطلب', { exact: true })).toBeVisible();
  await expect(page.getByLabel('مبلغ السحب')).toHaveValue('20');
  await expect(page.getByLabel('ملاحظة طلب السحب')).toHaveValue('ملاحظة محفوظة');
  await page.screenshot({ path: 'test-results/withdrawal-320.png', fullPage: true });
});
