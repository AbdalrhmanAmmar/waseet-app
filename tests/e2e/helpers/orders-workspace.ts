import { expect, type Page } from '@playwright/test';
export async function setup(
  page: Page,
  options: {
    role?: 'DeliveryAgent' | 'ManagementEmployee';
    failNext?: boolean;
    terminalDetail?: boolean;
    failSave?: boolean;
    failAll?: boolean;
    empty?: boolean;
  } = {},
) {
  const management = options.role === 'ManagementEmployee';
  const calls: string[] = [];
  const orders = [
    {
      orderId: 1048,
      customerName: 'محمد أحمد',
      customerMobile: '+963944123456',
      customerArea: 'المزة، دمشق',
      customerAddress: 'شارع الفيلات، بناء 12، الطابق الثاني',
      status: 'Confirmed',
      orderTotalUSD: 35,
      items: [],
    },
    {
      orderId: 1049,
      customerName: 'سارة محمود',
      customerMobile: '0991234567',
      customerArea: 'المالكي، دمشق',
      customerAddress: 'شارع المدارس، بناء 7',
      status: 'Out for Delivery',
      orderTotalUSD: 28,
      items: [],
    },
    {
      orderId: 1050,
      customerName: 'عميل مكتمل',
      status: 'Delivered',
      orderTotalUSD: 20,
      items: [],
    },
    { orderId: 1051, customerName: 'أحمد علي', status: 'Stuck', orderTotalUSD: 40, items: [] },
  ];
  const user = {
    userId: 7,
    role: options.role ?? 'DeliveryAgent',
    accountStatus: 'Approved',
    firstName: 'أحمد',
  };
  let failNext = options.failNext;
  let failAll = options.failAll;
  let failSave = options.failSave;
  const pages: number[] = [];
  const mutations: unknown[] = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const captured: string[] = [];
    Object.assign(window, { deliveryLinks: captured });
    window.open = ((url: string | URL) => {
      captured.push(String(url));
      return null;
    }) as typeof window.open;
  });
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.split('/api/')[1];
    calls.push(path);
    if (!path.startsWith('Auth/'))
      expect(route.request().headers().authorization).toBe('Bearer test');
    if (path === 'Auth/login') return route.fulfill({ json: { data: { user, token: 'test' } } });
    if (path === 'User/7') return route.fulfill({ json: { data: user } });
    if (path === 'delivery-areas')
      return route.fulfill({
        json: { data: [{ deliveryAreaId: 1, city: 'المزة، دمشق', isInternalDelivery: true }] },
      });
    if (path === 'orders/statuses')
      return route.fulfill({
        json: {
          data: ['Processing', 'Confirmed', 'Out for Delivery', 'Delivered', 'Stuck'].map(
            (status) => ({ status, isTerminal: status === 'Delivered' }),
          ),
        },
      });
    if (path === (management ? 'orders' : 'orders/my-deliveries')) {
      const pageNum = Number(url.searchParams.get('page'));
      pages.push(pageNum);
      if (failAll || (pageNum === 2 && failNext))
        return route.fulfill({ status: 503, json: { message: 'offline' } });
      return route.fulfill({
        json: {
          data: {
            items: options.empty ? [] : orders.slice((pageNum - 1) * 2, pageNum * 2),
            page: pageNum,
            totalPages: options.empty ? 1 : 2,
            totalCount: options.empty ? 0 : 4,
          },
        },
      });
    }
    const id = Number(path.split('/')[1]);
    const order = orders.find((item) => item.orderId === id);
    if (path.endsWith('/status')) {
      const body = route.request().postDataJSON();
      mutations.push(body);
      if (failSave)
        return route.fulfill({ status: 403, json: { message: 'تغيير الحالة غير مسموح' } });
      if (order) order.status = body.targetStatus;
      return route.fulfill({ json: { isSuccess: true, data: order } });
    }
    if (order)
      return route.fulfill({
        json: { data: options.terminalDetail ? { ...order, status: 'Delivered' } : order },
      });
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto('/login');
  await page.getByPlaceholder('أدخل بريدك الإلكتروني').fill('test@example.com');
  await page.getByPlaceholder('أدخل كلمة المرور').fill('test-password');
  await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: management ? 'طلبات الإدارة' : 'طلبات التوصيل',
      exact: true,
    }),
  ).toBeVisible();
  return {
    pages,
    calls,
    mutations,
    recover: () => {
      failNext = false;
      failAll = false;
      failSave = false;
    },
  };
}
