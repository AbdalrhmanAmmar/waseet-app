import test from 'node:test';
import assert from 'node:assert/strict';
import {
  internalTargets,
  internalTerminal,
  canEditInternal,
  internalRequiresNote,
} from '../src/domain/internal-order-policy';
import { orderDetails } from '../src/api/normalizers';
import { guardedStatusChange } from '../src/api/shared/order-guards';
const order = orderDetails(
  {
    orderId: 21,
    status: 'Processing',
    orderType: 'Normal',
    oliveryOrderId: null,
    userId: 7,
    assignedToEmployeeId: 7,
    assignedToDeliveryAgentId: 7,
    customerArea: 'دمشق',
    items: [],
  },
  21,
);
const roles = ['Merchant', 'SalesEmployee', 'DeliveryAgent', 'ManagementEmployee'];
const matrix: [string, string, string[]][] = [
  ['Processing', 'Confirmed', ['ManagementEmployee']],
  ['Confirmed', 'Ready for Dispatch', ['ManagementEmployee']],
  ['Processing', 'Stuck', ['ManagementEmployee']],
  ['Stuck', 'Processing', ['Merchant', 'SalesEmployee', 'ManagementEmployee']],
  ['Confirmed', 'Out for Delivery', ['ManagementEmployee']],
  ['Ready for Dispatch', 'Out for Delivery', ['ManagementEmployee']],
  ['Postponed', 'Out for Delivery', ['ManagementEmployee']],
  ...['Delivered', 'Refused on Delivery', 'Postponed', 'Stuck'].map(
    (to) =>
      ['Out for Delivery', to, ['DeliveryAgent', 'ManagementEmployee']] as [
        string,
        string,
        string[],
      ],
  ),
  ...[
    'Processing',
    'Confirmed',
    'Ready for Dispatch',
    'Stuck',
    'Out for Delivery',
    'Postponed',
  ].map((from) => [from, 'Cancelled', roles] as [string, string, string[]]),
  ['Cancelled', 'Completed_return', ['ManagementEmployee']],
  ['Refused on Delivery', 'Completed_return', ['ManagementEmployee']],
  ['Delivered', 'Completed', ['ManagementEmployee']],
];
test('all internal normal transition permissions match the four-role matrix', () => {
  for (const [from, to, allowed] of matrix)
    for (const role of roles) {
      assert.equal(
        internalTargets({ ...order, status: from }, { role, userId: 7 }, 'internal').includes(to),
        allowed.includes(role),
        `${role}: ${from} -> ${to}`,
      );
      assert.equal(
        internalTargets({ ...order, status: from }, { role, userId: 99 }, 'internal').includes(to),
        to === 'Cancelled',
        `unassigned/non-owner ${role}: ${from} -> ${to}`,
      );
    }
  for (const role of roles)
    for (const status of [
      'Completed',
      'Completed_return',
      'completed_returned',
      'Closed',
      'Unknown',
    ])
      assert.deepEqual(internalTargets({ ...order, status }, { role, userId: 7 }, 'internal'), []);
});
test('return lifecycle never exposes normal delivery or cancellation', () => {
  const states = {
    Processing: ['Confirmed'],
    Confirmed: ['returned_in_progress'],
    returned_in_progress: ['returned_delivered'],
    returned_delivered: ['completed_returned'],
  };
  for (const [status, expected] of Object.entries(states))
    for (const role of roles) {
      const returning = { ...order, orderType: 'Return', status };
      assert.deepEqual(
        internalTargets(returning, { role, userId: 7 }, 'internal'),
        role === 'ManagementEmployee' ||
          (role === 'DeliveryAgent' && ['Confirmed', 'returned_in_progress'].includes(status))
          ? expected
          : [],
      );
      assert.deepEqual(internalTargets(returning, { role, userId: 99 }, 'internal'), []);
      assert.deepEqual(
        internalTargets({ ...returning, isReturnFinalized: true }, { role, userId: 7 }, 'internal'),
        [],
      );
    }
});
test('employee ownership uses ownerMerchantId; missing identity and external routing fail closed', () => {
  const stuck = { ...order, status: 'Stuck' };
  assert.deepEqual(
    internalTargets(
      stuck,
      { role: 'MerchantEmployee', userId: 99, ownerMerchantId: 7 },
      'internal',
    ),
    ['Processing', 'Cancelled'],
  );
  assert.deepEqual(internalTargets(stuck, { role: 'MerchantEmployee', userId: 7 }, 'internal'), [
    'Cancelled',
  ]);
  for (const patch of [
    { orderType: undefined },
    { oliveryOrderId: undefined },
    { oliveryOrderId: 22 },
  ])
    assert.deepEqual(
      internalTargets(
        { ...order, ...patch },
        { role: 'ManagementEmployee', userId: 7 },
        'internal',
      ),
      [],
    );
  assert.deepEqual(
    internalTargets(order, { role: 'ManagementEmployee', userId: 7 }, 'external'),
    [],
  );
  assert.deepEqual(
    internalTargets(
      order,
      { role: 'ManagementEmployee', userId: 7, accountStatus: 'Suspended' },
      'internal',
    ),
    [],
  );
  assert.deepEqual(internalTargets(order, null, 'internal'), []);
});
test('assigned management may edit closed internal orders; cancellation is not terminal', () => {
  for (const role of roles)
    for (const status of ['Processing', 'Completed', 'Cancelled', 'Closed'])
      assert.equal(
        canEditInternal({ ...order, status }, { role, userId: 7 }, 'internal'),
        role === 'ManagementEmployee',
      );
  assert.equal(
    canEditInternal(order, { role: 'ManagementEmployee', userId: 99 }, 'internal'),
    false,
  );
  assert.equal(internalTerminal('Cancelled'), false);
  assert.equal(internalTerminal('completed_returned'), true);
  assert.equal(internalRequiresNote('Stuck', 'Cancelled'), false);
  assert.equal(internalRequiresNote('Stuck', 'Processing'), true);
  assert.equal(internalRequiresNote('Out for Delivery', 'Stuck'), true);
});
test('PascalCase backend identity fields preserve explicit null routing', () => {
  const parsed = orderDetails(
    {
      ...order,
      oliveryOrderId: undefined,
      assignedToEmployeeId: undefined,
      userId: undefined,
      OliveryOrderId: null,
      AssignedToEmployeeId: 7,
      UserId: 7,
    },
    21,
  );
  assert.deepEqual(internalTargets(parsed, { role: 'ManagementEmployee', userId: 7 }, 'internal'), [
    'Confirmed',
    'Stuck',
    'Cancelled',
  ]);
});
test('guard rechecks assignment, verifies post-write details and handles a lost response', async () => {
  for (const scenario of ['reassigned', 'lost-response', 'unconfirmed', 'success']) {
    let current = { ...order, assignedToEmployeeId: scenario === 'reassigned' ? 99 : 7 };
    let writes = 0,
      reads = 0;
    const result = await guardedStatusChange(
      { orderId: 21, status: 'Confirmed', expectedStatus: 'Processing' },
      async (args) => {
        if (args.url === 'delivery-areas')
          return { data: [{ city: 'دمشق', deliveryAreaId: 1, isInternalDelivery: true, fee: 5 }] };
        if (args.url === 'orders/statuses')
          return { data: [{ status: 'Processing', isTerminal: false }] };
        if (args.method === 'POST') {
          writes++;
          if (scenario !== 'unconfirmed') current = { ...current, status: 'Confirmed' };
          return scenario === 'lost-response'
            ? { error: { status: 503, message: 'connection lost' } }
            : { data: { status: 'raw entity' } };
        }
        reads++;
        return { data: current };
      },
      { role: 'ManagementEmployee', userId: 7 },
    );
    assert.equal(writes, scenario === 'reassigned' ? 0 : 1);
    assert.equal(!!result.error, ['reassigned', 'unconfirmed'].includes(scenario));
    if (scenario !== 'reassigned') assert.equal(reads, 2);
  }
});

test('merchant cancellation uses explicit server delivery mode when auxiliary catalogs are denied', async () => {
  let current = { ...order, deliveryMode: 'internal', customerArea: 'اسم منطقة جديد' };
  let posts = 0;
  const result = await guardedStatusChange(
    { orderId: 21, status: 'Cancelled', expectedStatus: 'Processing' },
    async (args) => {
      if (args.url === 'delivery-areas' || args.url === 'orders/statuses')
        return { error: { status: 403, message: 'forbidden' } };
      if (args.method === 'POST') {
        posts++;
        current = { ...current, status: 'Cancelled' };
      }
      return { data: current };
    },
    { role: 'Merchant', userId: 7 },
  );
  assert.equal(result.error, undefined);
  assert.equal(posts, 1);
});

test('merchant detail contract with olivery null permits cancellation without ownership or assignment fields', () => {
  const raw = {
    orderId: 657173,
    customerName: 'Test',
    customerArea: 'دمشق',
    status: 'Processing',
    orderType: 'Normal',
    olivery: null,
    items: [],
  };
  const detail = orderDetails({ isSuccess: true, data: raw }, 657173);
  assert.equal(detail.oliveryOrderId, null);
  assert.deepEqual(internalTargets(detail, { role: 'Merchant', userId: 7 }, 'internal'), [
    'Cancelled',
  ]);
  assert.deepEqual(
    internalTargets({ ...detail, status: 'Stuck' }, { role: 'Merchant', userId: 7 }, 'internal'),
    ['Cancelled'],
  );
  assert.equal(canEditInternal(detail, { role: 'Merchant', userId: 7 }, 'internal'), false);
  for (const patch of [
    { olivery: undefined },
    { olivery: {} },
    { oliveryOrderId: 55 },
    { OliveryOrderId: 55 },
  ]) {
    assert.deepEqual(
      internalTargets(
        orderDetails({ ...raw, ...patch }, 657173),
        { role: 'Merchant', userId: 7 },
        'internal',
      ),
      [],
    );
  }
});
