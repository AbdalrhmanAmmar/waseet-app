import assert from 'node:assert/strict';
import test from 'node:test';
import type { AxiosRequestConfig } from 'axios';
import {
  deliveryMode,
  transitionReason,
  terminalStatus,
  orderVersion,
  validateOrderUpdate,
} from '../src/domain/order-workflow';
import { guardedOrderUpdate, guardedStatusChange } from '../src/api/shared/order-guards';
import { orderDetails } from '../src/api/normalizers';
import { orderWaybillHtml } from '../src/domain/order-waybill';
import type { OrderInput, ApiError } from '../src/types/models';
const definitions = [
  'Pending',
  'Processing',
  'Confirmed',
  'Out for Delivery',
  'Postponed',
  'Delivered',
  'Refused on Delivery',
  'Stuck',
  'Cancelled',
  'Closed',
].map((status) => ({ status, isTerminal: ['Cancelled', 'Closed'].includes(status) }));
const input: OrderInput = {
  customerName: 'محمد أحمد',
  customerMobile: '0991234567',
  customerArea: 'دمشق',
  customerAddress: 'شارع النصر 12',
  items: [{ productCode: 11, quantity: 2, actualSellPriceUSD: 15, color: 'أسود' }],
};
const actor = { role: 'ManagementEmployee', userId: 7 };
const original = {
  oliveryOrderId: null,
  orderType: 'Normal',
  assignedToEmployeeId: 7,
  ...input,
  orderId: 21,
  status: 'Processing',
  deliveryFee: 5,
  orderTotalUSD: 35,
};
const areas = [
  { deliveryAreaId: 1, city: 'دمشق', isInternalDelivery: true, fee: 5 },
  { deliveryAreaId: 2, city: 'حلب', isInternalDelivery: false, fee: 7 },
];
function mock(
  overrides: { status?: string; area?: string; deny?: string; invalidDetail?: boolean } = {},
) {
  const requests: AxiosRequestConfig[] = [];
  const current = {
    ...original,
    status: overrides.status ?? original.status,
    customerArea: overrides.area ?? original.customerArea,
  };
  const query = async (
    args: AxiosRequestConfig,
  ): Promise<{ data: unknown; error?: undefined } | { error: ApiError; data?: undefined }> => {
    requests.push(args);
    if (args.url === overrides.deny) return { error: { status: 403, message: 'Denied' } };
    if (args.method) {
      if (args.method === 'POST') current.status = args.data.targetStatus;
      return { data: { isSuccess: true } };
    }
    return {
      data: {
        data:
          args.url === 'delivery-areas'
            ? areas
            : args.url === 'orders/statuses'
              ? definitions
              : overrides.invalidDetail
                ? { orderId: 21, status: 'Processing', items: null }
                : current,
      },
    };
  };
  return { requests, query };
}
test('delivery mode matches Arabic aliases, missing and conflicting metadata fail closed', () => {
  assert.equal(
    deliveryMode('أَريحا', [
      { city: 'اريحا', deliveryAreaId: 1, fee: null, isInternalDelivery: true },
    ]),
    'internal',
  );
  assert.equal(
    deliveryMode('Olivery city', [
      {
        city: 'X',
        oliveryAreaName: 'olivery city',
        deliveryAreaId: 1,
        fee: null,
        isInternalDelivery: false,
      },
    ]),
    'external',
  );
  assert.equal(deliveryMode('X', [{ city: 'X', deliveryAreaId: 1, fee: null }]), 'unknown');
  assert.equal(
    deliveryMode('دمشق', [...areas, { ...areas[0], isInternalDelivery: false }]),
    'unknown',
  );
  assert.equal(deliveryMode('', areas), 'unknown');
});
test('internal transitions cannot skip delivery stages or roll back; terminal metadata controls closing delivered orders', () => {
  assert.equal(transitionReason('internal', 'Processing', 'Confirmed', definitions), null);
  assert.ok(transitionReason('internal', 'Processing', 'Delivered', definitions));
  assert.ok(transitionReason('internal', 'Out for Delivery', 'Processing', definitions));
  assert.equal(transitionReason('internal', 'Delivered', 'Closed', definitions), null);
  assert.equal(terminalStatus('Delivered', [{ status: 'Delivered', isTerminal: true }]), true);
  assert.ok(
    transitionReason(
      'internal',
      'Delivered',
      'Closed',
      definitions.map((s) => ({ ...s, isTerminal: s.status === 'Delivered' })),
    ),
  );
  assert.ok(transitionReason('unknown', 'Processing', 'Confirmed', definitions));
  assert.ok(transitionReason('internal', 'Invented', 'Confirmed', definitions));
});
test('external orders allow only processing confirmation or stuck and resolving stuck', () => {
  for (const target of ['Confirmed', 'Stuck'])
    assert.equal(transitionReason('external', 'Processing', target, definitions), null);
  assert.equal(transitionReason('external', 'Stuck', 'Processing', definitions), null);
  for (const [from, to] of [
    ['Pending', 'Processing'],
    ['Processing', 'Cancelled'],
    ['Confirmed', 'Out for Delivery'],
    ['Delivered', 'Closed'],
  ])
    assert.ok(transitionReason('external', from, to, definitions));
});
test('status mutation verifies current status, delivery mode and mandatory note before POST', async () => {
  const allowed = mock();
  await guardedStatusChange(
    { orderId: 21, status: 'Confirmed', expectedStatus: 'Processing' },
    allowed.query,
    actor,
  );
  assert.deepEqual(
    allowed.requests.find((r) => r.method === 'POST'),
    {
      url: 'orders/21/status',
      method: 'POST',
      data: { targetStatus: 'Confirmed' },
    },
  );
  for (const options of [{ status: 'Delivered' }, { invalidDetail: true }]) {
    const api = mock(options);
    const response = await guardedStatusChange(
      { orderId: 21, status: 'Cancelled', expectedStatus: 'Processing' },
      api.query,
    );
    assert.ok(response.error);
    assert.ok(api.requests.every((r) => !r.method));
  }
  const stuck = mock({ status: 'Stuck', area: 'حلب' });
  assert.ok((await guardedStatusChange({ orderId: 21, status: 'Processing' }, stuck.query)).error);
  await guardedStatusChange(
    { orderId: 21, status: 'Processing', notes: '  تم التواصل  ' },
    stuck.query,
    actor,
  );
  assert.deepEqual(stuck.requests.find((r) => r.method === 'POST')?.data, {
    targetStatus: 'Processing',
    note: 'تم التواصل',
  });
});
test('editing sends all rows and colors, rejects concurrent changes and original or target external area', async () => {
  const baseline = orderVersion(orderDetails(original, 21));
  const api = mock();
  const updated = { ...input, items: [{ ...input.items[0], quantity: 3, color: 'أبيض' }] };
  assert.equal(
    (
      await guardedOrderUpdate(
        { orderId: 21, input: updated, expectedVersion: baseline },
        api.query,
        actor,
      )
    ).error,
    undefined,
  );
  assert.deepEqual(api.requests.at(-1), { url: 'orders/21', method: 'PUT', data: updated });
  for (const { overrides, body, version } of [
    { overrides: { status: 'Confirmed' }, body: updated, version: baseline },
    { overrides: { area: 'حلب' }, body: updated, version: baseline },
    { overrides: {}, body: { ...updated, customerArea: 'حلب' }, version: baseline },
    { overrides: { deny: 'orders/21' }, body: updated, version: baseline },
  ]) {
    const api = mock(overrides);
    assert.ok(
      (await guardedOrderUpdate({ orderId: 21, input: body, expectedVersion: version }, api.query))
        .error,
    );
    assert.ok(api.requests.every((r) => !r.method));
  }
});
test('edit validation refuses missing color, duplicate products, fractional quantity and invalid phones', () => {
  assert.equal(validateOrderUpdate(input), null);
  for (const value of [
    { ...input, items: [] },
    { ...input, customerMobile: '123' },
    { ...input, items: [input.items[0], input.items[0]] },
    ...[
      { color: '' },
      { quantity: 1.5 },
      { actualSellPriceUSD: NaN },
      { actualSellPriceUSD: 1.111 },
    ].map((patch) => ({ ...input, items: [{ ...input.items[0], ...patch }] })),
  ])
    assert.ok(validateOrderUpdate(value));
});
test('waybill escapes all customer content, uses recorded total once and never exports cost or profit', () => {
  const html = orderWaybillHtml(
    orderDetails(
      {
        ...original,
        customerName: '<script>unsafe</script>',
        totalMerchantProfitUSD: 87654,
        items: [{ ...input.items[0], merchantSellPriceUSD: 8899 }],
      },
      21,
    ),
  );
  assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
  assert.ok(!html.includes('<script>unsafe'));
  assert.ok(!html.includes('87654'));
  assert.ok(!html.includes('8899'));
  assert.ok(html.includes('35.00'));
  assert.ok(!html.includes('40.00'));
});
