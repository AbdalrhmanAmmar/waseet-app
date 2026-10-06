import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, expect } from '@playwright/test';
import sharp from 'sharp';

// Capture the actual Expo web UI. All API calls use fictional local fixtures.
const exportRoot = resolve(process.argv[2] ?? '/tmp/waseet-store-preview');
const preset = process.argv[3] ?? 'phone';
if (!['phone', 'iphone'].includes(preset)) throw new Error('Use phone or iphone as the screenshot preset');
const iphone = preset === 'iphone';
const viewport = iphone ? { width: 414, height: 896 } : { width: 432, height: 768 };
const deviceScaleFactor = iphone ? 3 : 2.5;
const width = viewport.width * deviceScaleFactor;
const height = viewport.height * deviceScaleFactor;
const output = resolve(iphone ? 'assets/store/iphone-screenshots' : 'assets/store/screenshots');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  try {
    let path = resolve(exportRoot, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(exportRoot + '/')) path = resolve(exportRoot, 'index.html');
    if (!(await stat(path).catch(() => null))?.isFile()) path = resolve(exportRoot, 'index.html');
    res.setHeader('Content-Type', mime[extname(path)] ?? 'application/octet-stream');
    res.end(await readFile(path));
  } catch { res.writeHead(500); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const products = [
  { productCode: 185208, name: 'حقيبة يومية', originalPrice: 20, merchantSellPrice: 25, expectedSellPrice: 35, quantity: 18 },
  { productCode: 267661, name: 'سماعات لاسلكية', originalPrice: 15, merchantSellPrice: 20, expectedSellPrice: 30, quantity: 24 },
  { productCode: 281531, name: 'ساعة كلاسيكية', originalPrice: 30, merchantSellPrice: 40, expectedSellPrice: 55, quantity: 12 },
];
const orders = ['Confirmed', 'Out for Delivery', 'Delivered', 'Processing', 'Stuck', 'Delivered'].map((status, i) => ({
  orderId: 1048 + i, customerName: ['أحمد محمد', 'سارة علي', 'نور خالد'][i % 3],
  customerMobile: '0900000000', customerArea: 'دمشق', customerAddress: 'عنوان توضيحي — شارع النصر',
  status, orderTotalUSD: [75, 35, 55][i % 3], deliveryFee: 5,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  items: [{ productCode: 185208, productName: 'حقيبة يومية', quantity: 2, actualSellPriceUSD: 35, color: 'أسود' }],
}));
const errors = [];
async function makePage(role) {
  const context = await browser.newContext({ viewport, deviceScaleFactor, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  const user = { userId: 7, role, firstName: 'أحمد', lastName: 'محمد', accountStatus: 'Approved', dollarBalance: 1250 };
  await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (!url.pathname.includes('/api/')) {
      if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
      return route.abort();
    }
    const path = url.pathname.split('/api/')[1];
    let data = [];
    if (path === 'Auth/login') data = { user, token: 'local-demo-session', dollarBalance: 1250 };
    else if (path === 'User/7') data = user;
    else if (path === 'Product/order-options') data = products;
    else if (path === 'Product/all') data = { items: products, page: 1, totalPages: 1, totalCount: products.length };
    else if (path.startsWith('Product/')) data = products.find(p => String(p.productCode) === path.split('/')[1]);
    else if (path === 'delivery-areas') data = [{ deliveryAreaId: 1, city: 'دمشق', fee: 5, isInternalDelivery: true }];
    else if (path === 'orders/statuses') data = ['Pending', 'Processing', 'Confirmed', 'Out for Delivery', 'Delivered', 'Stuck'].map(status => ({ status, isTerminal: status === 'Delivered' }));
    else if (path === 'orders' || path === 'orders/my-deliveries') {
      const status = url.searchParams.get('Status');
      const items = status ? orders.filter(o => o.status === status) : orders;
      data = { items, page: 1, totalPages: 1, totalCount: items.length };
    } else if (/^orders\/\d+$/.test(path)) data = orders.find(o => String(o.orderId) === path.split('/')[1]);
    if (request.method() !== 'GET' && path !== 'Auth/login') throw new Error(`Unexpected mutation ${path}`);
    return route.fulfill({ json: { isSuccess: true, data } });
  });
  await page.goto(`${origin}/login`);
  await expect(page.getByPlaceholder('أدخل بريدك الإلكتروني')).toBeVisible();
  return page;
}
async function login(page) {
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('demo@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('demo-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(page.getByRole('tab').first()).toBeVisible();
}
async function capture(page, filename) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.activeElement?.blur?.());
  await expect(page.getByRole('alert')).toHaveCount(0);
  const path = resolve(output, filename);
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  const metadata = await sharp(path).metadata(); const info = await stat(path);
  if (metadata.width !== width || metadata.height !== height || info.size > 8_000_000) throw new Error(`Invalid image ${filename}`);
  console.log(`${filename}: ${width} × ${height} PNG, ${info.size} bytes`);
}
try {
  const merchant = await makePage('Merchant');
  await capture(merchant, '06-login.png');
  await login(merchant);
  await expect(merchant.getByTestId('balance-amount')).toContainText('1,250.00');
  await capture(merchant, '01-merchant-home.png');
  await merchant.getByRole('tab', { name: /طلب جديد/ }).click();
  await expect(merchant.getByLabel('اسم العميل *', { exact: true })).toBeVisible();
  await merchant.getByLabel('اسم العميل *', { exact: true }).fill('أحمد محمد');
  await merchant.getByLabel('رقم الهاتف السوري *', { exact: true }).fill('0900000000');
  await merchant.getByRole('button', { name: 'اختيار منطقة التوصيل', exact: true }).click();
  await merchant.getByRole('button', { name: 'اختيار دمشق', exact: true }).click();
  await merchant.getByLabel('العنوان التفصيلي *', { exact: true }).fill('عنوان توضيحي — شارع النصر');
  await merchant.getByRole('button', { name: 'إضافة منتج', exact: true }).click();
  await merchant.getByRole('button', { name: 'اختيار حقيبة يومية', exact: true }).click();
  await merchant.getByLabel('كمية حقيبة يومية', { exact: true }).fill('2');
  await merchant.getByLabel('لون حقيبة يومية *', { exact: true }).fill('أسود');
  await merchant.getByRole('button', { name: 'مراجعة الطلب', exact: true }).click();
  await expect(merchant.getByRole('button', { name: 'تأكيد وإنشاء الطلب', exact: true })).toBeVisible();
  await capture(merchant, '03-create-order.png');
  await merchant.context().close();

  const sales = await makePage('SalesEmployee');
  await login(sales);
  await sales.getByRole('tab', { name: /المنتجات/ }).click();
  await expect(sales.getByTestId('sales-product-185208')).toBeVisible();
  await capture(sales, '02-sales-products.png');
  await sales.context().close();

  for (const [role, heading, filename] of [
    ['ManagementEmployee', 'طلبات الإدارة', '04-management-orders.png'],
    ['DeliveryAgent', 'طلبات التوصيل', '05-delivery-orders.png'],
  ]) {
    const page = await makePage(role);
    await login(page);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await capture(page, filename);
    await page.context().close();
  }
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
