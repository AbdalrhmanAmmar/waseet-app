import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const image = readFileSync('assets/images/brand-logo.png');
const description = Array.from(
  { length: 8 },
  (_, i) => `تفصيل ${i + 1}: وصف المنتج الكامل من الخادم مع معلومات الاستخدام والعناية.`,
).join('\n');
async function setup(
  page: Page,
  options: {
    role?: string;
    suggested?: number | null;
    fail?: number;
    imageFail?: boolean;
    video?: boolean;
  } = {},
) {
  const role = options.role ?? 'Merchant';
  const user = { userId: 7, role, accountStatus: 'Approved' };
  const initial = {
    productCode: 104,
    name: 'منتج الكتالوج',
    expectedSellPrice: 99,
    merchantSellPrice: 60,
    quantity: 99,
  };
  let fail = options.fail ?? 0;
  let imageFail = !!options.imageFail;
  let stock = 3;
  const calls: string[] = [];
  await page.route('**/media/product.png', (route) =>
    imageFail
      ? route.fulfill({ status: 404 })
      : route.fulfill({ body: image, contentType: 'image/png' }),
  );
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.split('/api/')[1];
    calls.push(path);
    if (path === 'Auth/login')
      return route.fulfill({ json: { data: { user, token: 'test-session' } } });
    if (path === 'User/7') return route.fulfill({ json: { data: user } });
    if (path === 'Product/all')
      return route.fulfill({
        json: { data: { items: [initial], page: 1, totalPages: 1, totalCount: 1 } },
      });
    if (path === 'Product/104/merchant-price/7')
      return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
    if (path === 'Product/104')
      return route.fulfill(
        fail
          ? { status: fail, json: { message: 'unavailable' } }
          : {
              json: {
                data: {
                  ...initial,
                  name: 'سماعات لاسلكية',
                  expectedSellPrice: options.suggested === undefined ? 35 : options.suggested,
                  merchantSellPrice: 30,
                  quantity: stock,
                  description,
                  updatedAt: '2026-09-18T12:00:00Z',
                  imageUrl: 'http://127.0.0.1:4173/media/product.png',
                  videoUrl: options.video ? 'http://127.0.0.1:4173/media/product.webm' : null,
                },
              },
            },
      );
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await page.getByRole('tab', { name: /المنتجات/ }).click();
  await page.getByRole('button', { name: 'تفاصيل منتج الكتالوج', exact: true }).click();
  return {
    calls,
    recover: (keepImageFailure = false) => {
      fail = 0;
      imageFail = keepImageFailure;
    },
    setStock: (value: number) => {
      stock = value;
    },
  };
}
test('fresh details and prices use Product/id only, copy, expand and prefill an order', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 950 });
  const api = await setup(page, { video: true });
  await expect(page.getByRole('heading', { name: 'سماعات لاسلكية', exact: true })).toBeVisible();
  await expect(page.getByTestId('detail-merchant-price')).toHaveText('30.00 USD');
  await expect(page.getByTestId('detail-suggested-price')).toHaveText('35.00 USD');
  expect(api.calls).toContain('Product/104');
  expect(
    api.calls.some((path) => path.includes('merchant-price') || path.startsWith('price-lists')),
  ).toBe(false);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'نسخ كود المنتج' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('104');
  await page.getByRole('button', { name: 'تكبير صورة المنتج' }).click();
  await page.getByRole('button', { name: 'تكبير أكثر' }).click();
  await expect(page.getByRole('img', { name: 'صورة مكبرة: سماعات لاسلكية' })).toBeVisible();
  await page.getByRole('button', { name: 'إغلاق الصورة' }).click();
  await page.getByRole('button', { name: 'زيادة الكمية', exact: true }).click();
  await expect(page.getByTestId('detail-total')).toHaveText('70.00 USD');
  await page.getByRole('button', { name: 'عرض المزيد', exact: true }).click();
  await expect(page.getByRole('button', { name: 'عرض أقل', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'عرض أقل', exact: true }).click();
  await page.getByRole('radio', { name: 'الصورة', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/details-content.png', fullPage: true });
  await page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }).click();
  await expect(page).toHaveURL(/\/merchant\/create-order/);
  await expect(page.getByRole('textbox', { name: 'كمية سماعات لاسلكية', exact: true })).toHaveValue(
    '2',
  );
  await expect(
    page.getByRole('textbox', { name: 'سعر بيع سماعات لاسلكية (USD)', exact: true }),
  ).toHaveValue('35');
});

test('missing suggested price is explicit and sales users do not request or see merchant pricing', async ({
  page,
}) => {
  const api = await setup(page, { role: 'SalesEmployee', suggested: null });
  await expect(page.getByTestId('detail-suggested-price')).toHaveText('غير محدد');
  await expect(page.getByTestId('detail-merchant-price')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'الفيديو', exact: true })).toHaveCount(0);
  expect(api.calls.some((path) => path.includes('merchant-price'))).toBe(false);
  await page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }).click();
  await expect(page).toHaveURL(/\/sales-employee\/create-order/);
});
test('deleted product never falls back to stale card data', async ({ page }) => {
  await setup(page, { fail: 404 });
  await expect(page.getByRole('heading', { name: 'المنتج غير موجود', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'العودة للمنتجات', exact: true }).click();
  await expect(page).toHaveURL(/\/merchant\/products/);
});
test('failed details block additions until retry, image errors recover at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const api = await setup(page, { fail: 503, imageFail: true });
  await expect(page.getByRole('alert')).toContainText('تعذر تحميل تفاصيل المنتج');
  await expect(
    page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }),
  ).toBeDisabled();
  api.recover(true);
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'إعادة محاولة الصورة', exact: true }),
  ).toBeVisible();
  api.recover();
  await page.getByRole('button', { name: 'إعادة محاولة الصورة', exact: true }).click();
  await expect(page.getByRole('button', { name: 'تكبير صورة المنتج' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }),
  ).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('stock refresh on return disables a sold-out product', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const api = await setup(page);
  await expect(
    page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }),
  ).toBeEnabled();
  api.setStock(0);
  await page.getByRole('button', { name: 'إنشاء طلب بهذا المنتج', exact: true }).click();
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await page.getByRole('button', { name: 'تجاهل البيانات والمغادرة', exact: true }).click();
  await expect(page.getByText('نفدت الكمية', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'غير متوفر حاليًا', exact: true })).toBeDisabled();
  expect(api.calls.filter((path) => path === 'Product/104').length).toBeGreaterThan(1);
  expect(api.calls.some((path) => path.includes('merchant-price'))).toBe(false);
  await expect(page.getByRole('button', { name: 'رجوع', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'رجوع', exact: true }).click();
  await expect(page.getByRole('tab', { name: /الرئيسية/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test('video is loaded only on explicit play, supports playback and reports errors with retry', async ({
  page,
}) => {
  let videoCalls = 0;
  await page.goto('/login');
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    const done = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    });
    recorder.start();
    let step = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = step++ % 2 ? '#147D64' : '#F8FAF7';
      ctx.fillRect(0, 0, 64, 64);
    }, 100);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    clearInterval(timer);
    recorder.stop();
    const blob = await done;
    stream.getTracks().forEach((track) => track.stop());
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.readAsDataURL(blob);
    });
  });
  let badVideo = false;
  await page.route('**/media/product.webm', (route) => {
    videoCalls++;
    return route.fulfill(
      badVideo
        ? { status: 404 }
        : { body: Buffer.from(base64, 'base64'), contentType: 'video/webm' },
    );
  });
  await setup(page, { video: true });
  await expect(page.getByRole('radio', { name: 'الفيديو', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'الفيديو', exact: true }).click();
  expect(videoCalls).toBe(0);
  await page.getByRole('button', { name: 'تشغيل فيديو المنتج' }).click();
  await expect
    .poll(() => page.locator('video').evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(0);
  await page.getByRole('radio', { name: 'الصورة', exact: true }).click();
  await expect(page.locator('video')).toHaveCount(0);
  badVideo = true;
  await page.getByRole('radio', { name: 'الفيديو', exact: true }).click();
  await page.getByRole('button', { name: 'تشغيل فيديو المنتج' }).click();
  await expect(page.getByRole('alert')).toHaveText('تعذر تشغيل الفيديو');
  badVideo = false;
  await page.getByRole('button', { name: 'إعادة محاولة الفيديو' }).click();
  await expect
    .poll(() => page.locator('video').evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(0);
});
