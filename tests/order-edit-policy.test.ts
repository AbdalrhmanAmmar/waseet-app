import assert from 'node:assert/strict';
import test from 'node:test';
import { orderEditDecision } from '../src/domain/order-edit-policy';
import { can } from '../src/auth/permissions';
import { guardedOrderUpdate } from '../src/api/shared/order-guards';
import { orderDetails } from '../src/api/normalizers';
import { resolveDeliveryMode } from '../src/domain/order-delivery-list';
import { orderVersion } from '../src/domain/order-workflow';
import type { Order, OrderInput } from '../src/types/models';
const actor = { role: 'ManagementEmployee', userId: 7 };
const order: Order = {
  orderId: 21,
  customerName: 'عميل',
  status: 'Delivered',
  orderType: 'Normal',
  oliveryOrderId: null,
  assignedToEmployeeId: 7,
  orderTotalUSD: 10,
  items: [],
};
test('every order-creating role may edit; the delivery agent never reaches the API', async () => {
  for (const role of [
    'ManagementEmployee',
    'Merchant',
    'MerchantEmployee',
    'SalesEmployee',
  ] as const)
    assert.equal(can(role, 'orders.edit'), true);
  for (const role of ['DeliveryAgent'] as const) {
    assert.equal(can(role, 'orders.edit'), false);
    assert.equal(orderEditDecision(order, { ...actor, role }, 'internal').allowed, false);
    let reads = 0;
    const result = await guardedOrderUpdate(
      { orderId: 21, input: {} as OrderInput, expectedVersion: '' },
      () => {
        reads++;
        return { data: {} };
      },
      { ...actor, role },
    );
    assert.ok(result.error);
    assert.equal(reads, 0);
  }
});
test('internal normal editing permits all statuses but keeps role restrictions and return read-only', () => {
  for (const status of ['Processing', 'Confirmed', 'Delivered', 'Completed'])
    assert.equal(orderEditDecision({ ...order, status }, actor, 'internal').allowed, true);
  assert.equal(orderEditDecision(order, { ...actor, userId: 8 }, 'internal').allowed, true);
  assert.equal(
    orderEditDecision({ ...order, orderType: 'Return' }, actor, 'internal').allowed,
    false,
  );
});
test('external editing follows dashboard OR rule and uses only raw Olivery status', () => {
  const external = { ...order, oliveryOrderId: 88, status: 'Printed Confirmed' };
  for (const oliveryStatus of ['waiting', 'printing_waiting'])
    assert.equal(
      orderEditDecision({ ...external, oliveryStatus }, actor, 'external').allowed,
      true,
    );
  assert.equal(
    orderEditDecision(
      { ...external, oliveryStatus: 'picked_up', deliveryStatus: 'waiting' },
      actor,
      'external',
    ).allowed,
    false,
  );
  assert.equal(
    orderEditDecision(
      { ...external, status: 'Confirmed', oliveryStatus: 'picked_up' },
      actor,
      'external',
    ).allowed,
    true,
  );
  assert.equal(
    orderEditDecision({ ...external, oliveryStatus: 'waiting_printed' }, actor, 'external').allowed,
    false,
  );
  assert.equal(
    orderEditDecision({ ...external, oliveryStatus: 'waiting' }, actor, 'unknown').allowed,
    false,
  );
});

// Full "When Order Details Can Be Modified" sheet, every status including the newer ones
// (Ready for Dispatch, refused reversals, In_Company, Olivery return close-out states).
const INTERNAL_STATUSES = [
  'Processing',
  'Confirmed',
  'Ready for Dispatch',
  'Out for Delivery',
  'Postponed',
  'Stuck',
  'Delivered',
  'Refused on Delivery',
  'Cancelled',
  'Completed',
  'Completed_return',
  'Closed',
];
const OWNERS = ['Merchant', 'MerchantEmployee', 'SalesEmployee'];
// The order belongs to user 7 whichever field each role is checked against.
const owned = { userId: 7, createdByMerchantEmployeeId: 7 };
test('internal: management edits in every status; owners only while Processing or Stuck', () => {
  const shapes = [
    { name: 'olivery: null', raw: { olivery: null } },
    { name: 'oliveryOrderId: null', raw: { oliveryOrderId: null } },
    { name: 'Olivery fields omitted', raw: {} },
  ];
  const areas = [{ deliveryAreaId: 1, city: 'دمشق', fee: 3, isInternalDelivery: true }];
  for (const { name, raw } of shapes)
    for (const status of INTERNAL_STATUSES) {
      const current = orderDetails(
        {
          orderId: 5,
          status,
          orderType: 'Normal',
          customerArea: 'دمشق',
          items: [],
          ...owned,
          ...raw,
        },
        5,
      );
      const mode = resolveDeliveryMode(current, areas);
      assert.equal(mode, 'internal', name);
      assert.equal(orderEditDecision(current, actor, mode).allowed, true, `${name} / ${status}`);
      for (const role of OWNERS)
        assert.equal(
          orderEditDecision(current, { role, userId: 7 }, mode).allowed,
          ['Processing', 'Stuck'].includes(status),
          `${role} / ${name} / ${status}`,
        );
      assert.equal(
        orderEditDecision(current, { role: 'DeliveryAgent', userId: 7 }, mode).allowed,
        false,
      );
    }
});
test('internal: an edit goes through when the API omits the Olivery fields', async () => {
  const current = {
    orderId: 21,
    status: 'Refused on Delivery',
    orderType: 'Normal',
    customerName: 'عميل',
    customerMobile: '0991234567',
    customerArea: 'دمشق',
    customerAddress: 'شارع النصر 12',
    items: [],
  };
  const input: OrderInput = {
    customerName: 'عميل',
    customerMobile: '0991234567',
    customerArea: 'دمشق',
    customerAddress: 'شارع النصر 14',
    items: [{ productCode: 11, quantity: 1, actualSellPriceUSD: 15, color: 'أسود' }],
  } as OrderInput;
  const puts: unknown[] = [];
  const result = await guardedOrderUpdate(
    { orderId: 21, input, expectedVersion: orderVersion(orderDetails(current, 21)) },
    (args) => {
      if (args.url === 'delivery-areas')
        return { data: [{ deliveryAreaId: 1, city: 'دمشق', fee: 3, isInternalDelivery: true }] };
      if (args.method === 'PUT') {
        puts.push(args.data);
        return { data: current };
      }
      return { data: current };
    },
    actor,
  );
  assert.equal(result.error, undefined);
  assert.deepEqual(puts, [input]);
});
test('external: Processing/Stuck/Confirmed OR raw waiting/printing_waiting, never In_Company', () => {
  const statuses = [
    'Processing',
    'Stuck',
    'Confirmed',
    'Printed Confirmed',
    'In_Company',
    'Cancelled',
  ];
  const olivery = [
    null,
    'waiting',
    'بالانتظار',
    'printing_waiting',
    'waiting_printed',
    'picking_up',
    'picked_up',
    'delivered',
    'rejected',
    'canceled',
    'branch_returned',
    'completed_returned',
  ];
  for (const status of statuses)
    for (const oliveryStatus of olivery) {
      const current = { ...order, ...owned, oliveryOrderId: 88, status, oliveryStatus };
      const code = oliveryStatus === 'بالانتظار' ? 'waiting' : oliveryStatus;
      const expected =
        status !== 'In_Company' &&
        (['Processing', 'Stuck', 'Confirmed'].includes(status) ||
          ['waiting', 'printing_waiting'].includes(code ?? ''));
      // External orders: one window for management and owners alike.
      for (const role of ['ManagementEmployee', ...OWNERS, 'DeliveryAgent'])
        assert.equal(
          orderEditDecision(current, { role, userId: 7 }, 'external').allowed,
          role !== 'DeliveryAgent' && expected,
          `${role} / ${status} / ${oliveryStatus}`,
        );
      // The filtered DeliveryStatus must never open the window on its own.
      assert.equal(
        orderEditDecision(
          { ...current, oliveryStatus: 'picked_up', deliveryStatus: 'waiting' },
          actor,
          'external',
        ).allowed,
        ['Processing', 'Stuck', 'Confirmed'].includes(status),
      );
    }
});

test('owners edit only their own orders; merchant employees are matched by creator', () => {
  const base = { ...order, status: 'Processing' };
  const ok = (o: Order, role: string, userId: number) =>
    orderEditDecision(o, { role, userId }, 'internal');
  // Sales: userId is the sales employee.
  assert.equal(ok({ ...base, userId: 7 }, 'SalesEmployee', 7).allowed, true);
  assert.match(ok({ ...base, userId: 8 }, 'SalesEmployee', 7).reason, /أنشأتها فقط/);
  // Merchant: userId is the merchant, also on orders created by their employees.
  const byEmployee = { ...base, userId: 163, createdByMerchantEmployeeId: 144 };
  assert.equal(ok(byEmployee, 'Merchant', 163).allowed, true);
  assert.match(ok({ ...base, userId: 164 }, 'Merchant', 163).reason, /طلبات حسابك فقط/);
  // Merchant employee: matched by createdByMerchantEmployeeId, never by the shared userId.
  assert.equal(ok(byEmployee, 'MerchantEmployee', 144).allowed, true);
  assert.match(ok(byEmployee, 'MerchantEmployee', 145).reason, /أنشأتها فقط/);
  const byMerchant = { ...base, userId: 163, createdByMerchantEmployeeId: null };
  assert.match(ok(byMerchant, 'MerchantEmployee', 144).reason, /تعذر التحقق من منشئ الطلب/);
  assert.match(ok({ ...base, userId: 144 }, 'MerchantEmployee', 144).reason, /تعذر التحقق/);
  // Merchant and sales responses may omit userId: their lists are server-scoped already.
  assert.equal(ok(base, 'Merchant', 163).allowed, true);
  assert.equal(ok(base, 'SalesEmployee', 7).allowed, true);
  // Status still decides after ownership.
  assert.match(
    ok({ ...base, userId: 7, status: 'Confirmed' }, 'SalesEmployee', 7).reason,
    /قيد المعالجة.*عالق/,
  );
  // Return orders and suspended accounts stay locked.
  assert.equal(ok({ ...base, userId: 7, orderType: 'Return' }, 'SalesEmployee', 7).allowed, false);
  assert.equal(
    orderEditDecision(
      { ...base, userId: 7 },
      { role: 'SalesEmployee', userId: 7, accountStatus: 'Suspended' },
      'internal',
    ).allowed,
    false,
  );
});

test('owner edit re-checks the fresh order: confirmed or reassigned meanwhile means no PUT', async () => {
  const fresh = {
    orderId: 21,
    status: 'Processing',
    orderType: 'Normal',
    userId: 7,
    customerName: 'عميل',
    customerMobile: '0991234567',
    customerArea: 'دمشق',
    customerAddress: 'شارع النصر 12',
    items: [],
  };
  const input = {
    customerName: 'عميل',
    customerMobile: '0991234567',
    customerArea: 'دمشق',
    customerAddress: 'شارع النصر 14',
    items: [{ productCode: 11, quantity: 1, actualSellPriceUSD: 15, color: 'أسود' }],
  } as OrderInput;
  const run = async (server: Record<string, unknown>) => {
    const puts: unknown[] = [];
    const result = await guardedOrderUpdate(
      { orderId: 21, input, expectedVersion: orderVersion(orderDetails(fresh, 21)) },
      (args) => {
        if (args.url === 'delivery-areas')
          return { data: [{ deliveryAreaId: 1, city: 'دمشق', fee: 3, isInternalDelivery: true }] };
        if (args.method === 'PUT') puts.push(args.data);
        return { data: server };
      },
      { role: 'SalesEmployee', userId: 7 },
    );
    return { result, puts };
  };
  const ok = await run(fresh);
  assert.equal(ok.result.error, undefined);
  assert.equal(ok.puts.length, 1);
  const confirmed = await run({ ...fresh, status: 'Confirmed' });
  assert.match(String(confirmed.result.error?.message), /قيد المعالجة/);
  assert.equal(confirmed.puts.length, 0);
  const other = await run({ ...fresh, userId: 8 });
  assert.match(String(other.result.error?.message), /أنشأتها فقط/);
  assert.equal(other.puts.length, 0);
});
