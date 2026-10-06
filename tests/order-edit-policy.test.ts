import assert from 'node:assert/strict';
import test from 'node:test';
import { orderEditDecision } from '../src/domain/order-edit-policy';
import { can } from '../src/auth/permissions';
import { guardedOrderUpdate } from '../src/api/shared/order-guards';
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
test('editing is management only, including mutation entry point', async () => {
  for (const role of ['Merchant', 'SalesEmployee', 'DeliveryAgent'] as const) {
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
