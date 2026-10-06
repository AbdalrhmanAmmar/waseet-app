import { test, expect } from '@playwright/test';
import { setup } from './helpers/orders-workspace';
test('delivery overview loads every page, searches Arabic, opens phone/maps links and shows only its two tabs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1100 });
  await setup(page);
  await expect(page.getByTestId('delivery-order-1051')).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.getByText('المطلوب تحصيله', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('delivery-order-1050')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'فلتر تحتاج متابعة', exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: 'test-results/delivery-orders.png', fullPage: true });
  await page.getByRole('button', { name: 'اتصال بعميل الطلب 1048', exact: true }).click();
  await page
    .getByRole('button', { name: 'البحث بعنوان الطلب 1048 في الخريطة', exact: true })
    .click();
  const links = await page.evaluate(
    () => (window as unknown as { deliveryLinks: string[] }).deliveryLinks,
  );
  // React Native Web hands tel: directly to the OS; the unit test verifies its exact URL.
  expect(new URL(links[0]).searchParams.get('query')).toBe(
    'شارع الفيلات، بناء 12، الطابق الثاني، المزة، دمشق',
  );
  await page.getByRole('textbox', { name: 'البحث في طلبات التوصيل' }).fill('١٠٥١');
  const card = page.getByTestId('delivery-order-1051');
  await expect(card).toBeVisible();
  await expect(card.getByRole('button', { name: /اتصال بعميل/ })).toBeDisabled();
  await expect(card.getByRole('button', { name: /في الخريطة/ })).toBeDisabled();
  await page.getByRole('button', { name: 'مسح البحث', exact: true }).click();
  await page.getByRole('button', { name: 'فلترة الحالات', exact: true }).click();
  await page.getByRole('checkbox', { name: 'حالة الطلب: تم التسليم', exact: true }).click();
  await page.getByRole('button', { name: 'عرض النتائج', exact: true }).click();
  await expect(page.getByTestId('delivery-order-1050')).toContainText('هذا الطلب في حالة نهائية');
  await expect(
    page.getByRole('button', { name: 'تحديث حالة الطلب 1050', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'فتح طلب #1050', exact: true }).click();
  await expect(page.getByText('العميل: عميل مكتمل', { exact: true })).toBeVisible();
});

test('status change requires explicit review, sends the API contract and refreshes the list', async ({
  page,
}) => {
  const api = await setup(page);
  await page.getByRole('button', { name: 'تحديث حالة الطلب 1048', exact: true }).click();
  const sheet = page.getByTestId('delivery-status-sheet');
  await sheet.getByRole('radio', { name: 'تم التسليم', exact: true }).click();
  await sheet.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  await expect(
    sheet.getByRole('heading', { name: 'تأكيد تحديث الحالة', exact: true }),
  ).toBeVisible();
  expect(api.mutations).toEqual([]);
  await page.screenshot({ path: 'test-results/delivery-confirm.png', fullPage: true });
  await sheet.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  expect(api.mutations).toEqual([{ targetStatus: 'Delivered' }]);
  await expect(page.getByTestId('delivery-order-1048')).toContainText('تم التسليم');
});

test('stuck reason is required; server rejection preserves notes and requires a new selection on a small phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const api = await setup(page, { failSave: true });
  await page.screenshot({ path: 'test-results/delivery-320.png', fullPage: true });
  await page.getByRole('button', { name: 'تحديث حالة الطلب 1048', exact: true }).click();
  const sheet = page.getByTestId('delivery-status-sheet');
  await sheet.getByRole('radio', { name: 'عالق', exact: true }).click();
  await sheet.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  await expect(sheet.getByRole('alert')).toContainText('سبب تعثر الطلب');
  await sheet.getByRole('textbox', { name: 'ملاحظات تغيير الحالة' }).fill('العميل لا يرد');
  await sheet.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  await sheet.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
  await expect(sheet.getByRole('alert')).toContainText('الخادم لا يسمح لحسابك');
  await sheet.getByRole('radio', { name: 'عالق', exact: true }).click();
  await expect(sheet.getByRole('textbox', { name: 'ملاحظات تغيير الحالة' })).toHaveValue(
    'العميل لا يرد',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  api.recover();
  await sheet.getByRole('button', { name: 'مراجعة التغيير', exact: true }).click();
  await sheet.getByRole('button', { name: 'تأكيد وحفظ الحالة', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  expect(api.mutations.at(-1)).toEqual({ targetStatus: 'Stuck', note: 'العميل لا يرد' });
});

test('a fresh terminal status prevents changing a stale list order', async ({ page }) => {
  const api = await setup(page, { terminalDetail: true });
  await page.getByRole('button', { name: 'تحديث حالة الطلب 1048', exact: true }).click();
  const sheet = page.getByTestId('delivery-status-sheet');
  await expect(sheet).toContainText('هذا الطلب في حالة نهائية');
  await expect(sheet.getByRole('button', { name: 'مراجعة التغيير', exact: true })).toHaveCount(0);
  expect(api.mutations).toEqual([]);
});

test('partial loading keeps honest counts and retries only the failed page', async ({ page }) => {
  const api = await setup(page, { failNext: true });
  await expect(page.getByRole('alert')).toContainText('تعذر تحميل كل الطلبات');
  await expect(page.getByText('الأعداد والبحث ضمن الطلبات المحمّلة حتى الآن.')).toBeVisible();
  expect(api.pages).toEqual([1, 2]);
  api.recover();
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(page.getByTestId('delivery-order-1051')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(api.pages).toEqual([1, 2, 2]);
});

test('empty delivery list is distinct from initial failure', async ({ page }) => {
  const api = await setup(page, { empty: true, failAll: true });
  await expect(page.getByRole('alert')).toHaveText('تعذر تحميل طلبات التوصيل.');
  api.recover();
  await page.getByRole('button', { name: 'إعادة المحاولة', exact: true }).click();
  await expect(page.getByText('لا توجد طلبات مسندة إليك حاليًا', { exact: true })).toBeVisible();
});
