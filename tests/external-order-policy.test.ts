import test from 'node:test';
import assert from 'node:assert/strict';
import { orderDetails } from '../src/api/normalizers';
import {
  externalTargets,
  externalActionReason,
  canEditExternal,
  externalReturnReason,
  validateExternalReturn,
} from '../src/domain/external-order-policy';
import { resolveDeliveryMode } from '../src/domain/order-delivery-list';
import { guardedStatusChange, uncertainStatuses } from '../src/api/shared/order-guards';
const o = orderDetails(
  {
    orderId: 1,
    status: 'Processing',
    orderType: 'Normal',
    customerArea: 'حلب',
    deliveryMode: 'external',
    userId: 7,
    assignedToEmployeeId: 7,
    olivery: null,
    items: [{ orderItemId: 11, quantity: 3 }],
  },
  1,
);
const roles = ['Merchant', 'SalesEmployee', 'DeliveryAgent', 'ManagementEmployee'];
test('external four-role matrix enforces ownership, assignment and post-print cancellation', () => {
  const matrix: [string, string, string[]][] = [
    ['Processing', 'Confirmed', ['ManagementEmployee']],
    ['Processing', 'Stuck', ['ManagementEmployee']],
    ['Stuck', 'Processing', ['Merchant', 'SalesEmployee', 'ManagementEmployee']],
    ['Confirmed', 'Printed Confirmed', ['ManagementEmployee']],
    ...['Processing', 'Stuck', 'Confirmed'].map(
      (from) => [from, 'Cancelled', roles] as [string, string, string[]],
    ),
    ['Printed Confirmed', 'Cancelled', ['ManagementEmployee']],
  ];
  for (const [status, target, allowed] of matrix)
    for (const role of roles) {
      assert.equal(
        externalTargets({ ...o, status }, { role, userId: 7 }, 'external').includes(target),
        allowed.includes(role),
      );
      assert.equal(
        externalTargets({ ...o, status }, { role, userId: 99 }, 'external').includes(target),
        (target === 'Cancelled' && status !== 'Printed Confirmed') ||
          (role === 'ManagementEmployee' && allowed.includes(role)),
      );
    }
  for (const role of roles)
    for (const status of ['Processing', 'Confirmed', 'Printed Confirmed', 'Cancelled'])
      assert.ok(
        externalTargets({ ...o, status }, { role, userId: 7 }, 'external').every(
          (v) =>
            ![
              'Delivered',
              'Out for Delivery',
              'Completed',
              'Completed_return',
              'Postponed',
              'Refused on Delivery',
            ].includes(v),
        ),
      );
  assert.deepEqual(
    externalTargets(
      { ...o, status: 'Stuck' },
      { role: 'MerchantEmployee', userId: 88, ownerMerchantId: 7 },
      'external',
    ),
    ['Processing', 'Cancelled'],
  );
  assert.deepEqual(
    externalTargets(
      { ...o, orderType: 'Return' },
      { role: 'ManagementEmployee', userId: 7 },
      'external',
    ),
    [],
  );
});
test('nested response separates raw tracking from null filtered status and preserves identifiers', () => {
  const detail = orderDetails(
    {
      ...o,
      oliveryOrderId: undefined,
      olivery: { order_id: 123, sequence: 'SEQ-789', oliveryStatus: 'waiting_printed' },
      deliveryStatus: null,
    },
    1,
  );
  assert.equal(detail.oliveryOrderId, 123);
  assert.equal(detail.oliverySequence, 'SEQ-789');
  assert.equal(detail.oliveryStatus, 'waiting_printed');
  assert.equal(detail.deliveryStatus, null);
  assert.equal(resolveDeliveryMode({ ...detail, deliveryMode: 'internal' }, []), 'external');
  assert.equal(externalActionReason({ ...detail, status: 'Confirmed' }, 'Printed Confirmed'), null);
  assert.ok(externalActionReason(detail, 'Confirmed'));
  assert.ok(externalActionReason(o, 'Printed Confirmed'));
});
test('external edit window uses local status OR raw waiting, never filtered delivery status', () => {
  const actor = { role: 'ManagementEmployee', userId: 7 };
  assert.ok(
    canEditExternal({ ...o, status: 'Confirmed', oliveryStatus: 'picked_up' }, actor, 'external'),
  );
  assert.ok(
    canEditExternal(
      { ...o, status: 'Printed Confirmed', oliveryStatus: 'printing_waiting' },
      actor,
      'external',
    ),
  );
  assert.equal(
    canEditExternal(
      {
        ...o,
        status: 'Printed Confirmed',
        oliveryStatus: 'waiting_printed',
        deliveryStatus: 'waiting',
      },
      actor,
      'external',
    ),
    false,
  );
  assert.equal(canEditExternal(o, { role: 'Merchant', userId: 7 }, 'external'), false);
});
test('partial return eligibility and item quantities exclude repeats and unrelated roles', () => {
  const order = { ...o, oliveryStatus: 'تم التسليم ويوجد مرتجع' };
  const actor = { role: 'ManagementEmployee', userId: 7 };
  assert.equal(externalReturnReason(order, actor, 'external'), null);
  assert.ok(externalReturnReason({ ...order, isReturnProcessed: true }, actor, 'external'));
  assert.ok(externalReturnReason(order, { role: 'Merchant', userId: 7 }, 'external'));
  assert.equal(validateExternalReturn(order, { items: [{ orderItemId: 11, quantity: 2 }] }), null);
  for (const items of [
    [],
    [{ orderItemId: 11, quantity: 4 }],
    [{ orderItemId: 11, quantity: 1.5 }],
    [
      { orderItemId: 11, quantity: 1 },
      { orderItemId: 11, quantity: 1 },
    ],
  ])
    assert.ok(validateExternalReturn(order, { items }));
});
test('external cancellation reconciles actual details and does not treat provider rejection as success', async () => {
  for (const rejected of [true, false]) {
    uncertainStatuses.clear();
    let current = { ...o, status: 'Confirmed' };
    let writes = 0;
    const result = await guardedStatusChange(
      { orderId: 1, status: 'Cancelled' },
      async (args) => {
        if (args.url === 'delivery-areas') return { data: [] };
        if (args.method === 'POST') {
          writes++;
          if (rejected) return { error: { status: 400, message: 'provider rejected' } };
          current = { ...current, status: 'Cancelled' };
          return { data: { raw: true } };
        }
        return { data: current };
      },
      { role: 'Merchant', userId: 99 },
    );
    assert.equal(writes, 1);
    assert.equal(!!result.error, rejected);
    assert.equal(current.status, rejected ? 'Confirmed' : 'Cancelled');
  }
});

test('missing or empty ownership does not permit external stuck resolution', () => {
  for (const userId of [undefined, null, '', 0])
    assert.deepEqual(
      externalTargets({ ...o, status: 'Stuck', userId }, { role: 'Merchant', userId }, 'external'),
      ['Cancelled'],
    );
});
