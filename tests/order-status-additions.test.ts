// Covers the transitions added to the order-status spec on 2026-10-21..26:
// refused internal orders (Delivered / Cancelled), In_Company, and Olivery return close-out.
import test from 'node:test';
import assert from 'node:assert/strict';
import { orderDetails } from '../src/api/normalizers';
import {
  internalActionFor,
  internalRequiresNote,
  internalTargets,
} from '../src/domain/internal-order-policy';
import {
  canEditExternal,
  externalActionFor,
  externalReturnReason,
  externalTargets,
  externalTerminal,
} from '../src/domain/external-order-policy';
import { orderEditDecision } from '../src/domain/order-edit-policy';
import { orderStatusPresentation } from '../src/domain/order-status-presentation';
import { guardedStatusChange, uncertainStatuses } from '../src/api/shared/order-guards';
import type { Order } from '../src/types/models';

const management = { role: 'ManagementEmployee', userId: 7 };
const internalAreas = [{ deliveryAreaId: 1, city: 'دمشق', fee: 3, isInternalDelivery: true }];
const refused = orderDetails(
  {
    orderId: 31,
    status: 'Refused on Delivery',
    orderType: 'Normal',
    oliveryOrderId: null,
    userId: 7,
    customerArea: 'دمشق',
    items: [],
  },
  31,
);
const external = orderDetails(
  {
    orderId: 41,
    status: 'Printed Confirmed',
    orderType: 'Normal',
    customerArea: 'حلب',
    deliveryMode: 'external',
    userId: 7,
    oliveryOrderId: 900,
    oliverySequence: 'SEQ-900',
    items: [{ orderItemId: 11, quantity: 2 }],
  },
  41,
);

test('refused internal orders: management gets all three, delivery may only deliver', () => {
  const expected: Record<string, string[]> = {
    ManagementEmployee: ['Delivered', 'Cancelled', 'Completed_return'],
    DeliveryAgent: ['Delivered'],
    Merchant: [],
    MerchantEmployee: [],
    SalesEmployee: [],
  };
  for (const [role, targets] of Object.entries(expected))
    for (const userId of [7, 99])
      assert.deepEqual(internalTargets(refused, { role, userId }, 'internal'), targets, role);
});

test('cancelling stays open to every role everywhere except a refused order', () => {
  for (const status of ['Processing', 'Out for Delivery', 'Postponed'])
    assert.ok(
      internalTargets({ ...refused, status }, { role: 'Merchant', userId: 7 }, 'internal').includes(
        'Cancelled',
      ),
    );
});

test('reversing a refusal requires a note and explains the fee refund', () => {
  assert.equal(internalRequiresNote('Refused on Delivery', 'Delivered'), true);
  assert.equal(internalRequiresNote('Refused on Delivery', 'Cancelled'), true);
  assert.equal(internalRequiresNote('Refused on Delivery', 'Completed_return'), false);
  assert.equal(internalRequiresNote('Out for Delivery', 'Delivered'), false);
  assert.match(internalActionFor('Refused on Delivery', 'Delivered')!.effect, /تُرد رسوم التوصيل/);
  assert.match(internalActionFor('Refused on Delivery', 'Cancelled')!.effect, /تُرد رسوم التوصيل/);
  assert.doesNotMatch(internalActionFor('Out for Delivery', 'Delivered')!.effect, /تُرد/);
  assert.equal(internalActionFor('Refused on Delivery', 'Completed_return')?.label, 'إغلاق كراجع');
});

async function runGuard(
  current: Order,
  status: string,
  actor: { role: string; userId: number },
  notes?: string,
  areas: unknown[] = internalAreas,
  apply: (o: Order) => Order = (o) => ({ ...o, status }),
) {
  uncertainStatuses.clear();
  let state = current;
  const posts: unknown[] = [];
  const result = await guardedStatusChange(
    { orderId: current.orderId, status, notes, expectedStatus: current.status },
    async (args) => {
      if (args.url === 'delivery-areas') return { data: areas };
      if (args.method === 'POST') {
        posts.push(args.data);
        state = apply(state);
        return { data: { raw: true } };
      }
      return { data: state };
    },
    actor,
  );
  return { result, posts };
}

test('guard blocks merchant refusal cancellation and note-less reversals before any write', async () => {
  const merchant = await runGuard(refused, 'Cancelled', { role: 'Merchant', userId: 7 });
  assert.ok(merchant.result.error);
  assert.equal(merchant.posts.length, 0);
  const noNote = await runGuard(refused, 'Delivered', management);
  assert.match(String(noNote.result.error?.message), /الطلب المرفوض/);
  assert.equal(noNote.posts.length, 0);
  const ok = await runGuard(refused, 'Delivered', management, 'العميل رجع استلم');
  assert.equal(ok.result.error, undefined);
  assert.deepEqual(ok.posts, [{ targetStatus: 'Delivered', note: 'العميل رجع استلم' }]);
  const agent = await runGuard(refused, 'Delivered', { role: 'DeliveryAgent', userId: 5 }, 'تم');
  assert.equal(agent.result.error, undefined);
});

test('In_Company: management marks it after print, then nothing moves it locally', () => {
  assert.deepEqual(externalTargets(external, management, 'external'), ['In_Company', 'Cancelled']);
  for (const role of ['Merchant', 'MerchantEmployee', 'SalesEmployee', 'DeliveryAgent'])
    assert.ok(!externalTargets(external, { role, userId: 7 }, 'external').includes('In_Company'));
  const inCompany = { ...external, status: 'In_Company' };
  for (const role of ['Merchant', 'SalesEmployee', 'DeliveryAgent', 'ManagementEmployee'])
    assert.deepEqual(externalTargets(inCompany, { role, userId: 7 }, 'external'), []);
  assert.equal(externalTerminal(inCompany), false);
  assert.equal(orderStatusPresentation('In_Company', 'internal').label, 'في الشركة');
});

test('In_Company locks editing for everyone, even while Olivery is still waiting', () => {
  const locked = { ...external, status: 'In_Company', oliveryStatus: 'waiting' };
  assert.equal(canEditExternal(locked, management, 'external'), false);
  assert.ok(canEditExternal({ ...locked, status: 'Printed Confirmed' }, management, 'external'));
  const decision = orderEditDecision(locked, management, 'external');
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /In_Company/);
});

test('Olivery return close-out is offered from canceled or branch_returned only', () => {
  for (const [oliveryStatus, offered] of [
    ['canceled', true],
    ['ملغي', true],
    ['branch_returned', true],
    ['مرجع للفرع', true],
    ['returned_in_progress', false],
    ['completed_returned', false],
    ['delivered', false],
  ] as const)
    for (const status of ['Cancelled', 'Printed Confirmed', 'In_Company'])
      assert.equal(
        externalTargets({ ...external, status, oliveryStatus }, management, 'external').includes(
          'completed_returned',
        ),
        offered,
        `${status} / ${oliveryStatus}`,
      );
  const canceled = { ...external, status: 'Cancelled', oliveryStatus: 'canceled' };
  assert.deepEqual(externalTargets(canceled, { role: 'Merchant', userId: 7 }, 'external'), []);
  assert.deepEqual(
    externalTargets({ ...canceled, oliveryOrderId: null }, management, 'external'),
    [],
  );
  assert.match(externalActionFor(canceled, 'completed_returned')!.effect, /لا يتغير المخزون/);
  assert.match(
    externalActionFor({ ...canceled, oliveryStatus: 'branch_returned' }, 'completed_returned')!
      .effect,
    /تُعاد للمخزون/,
  );
});

test('a cancelled shipment awaiting its return close-out is not terminal', () => {
  assert.equal(externalTerminal({ status: 'Cancelled', oliveryStatus: 'canceled' }), false);
  assert.equal(externalTerminal({ status: 'Cancelled', oliveryStatus: 'مكتمل راجع' }), true);
  assert.equal(externalTerminal({ status: 'Cancelled', oliveryStatus: null }), true);
  assert.equal(externalTerminal({ status: 'Confirmed', oliveryStatus: null }), false);
});

test('return close-out is confirmed by the Olivery state since Order.Status never changes', async () => {
  const canceled = { ...external, status: 'Cancelled', oliveryStatus: 'canceled' };
  const ok = await runGuard(canceled, 'completed_returned', management, undefined, [], (o) => ({
    ...o,
    oliveryStatus: 'مكتمل راجع',
  }));
  assert.equal(ok.result.error, undefined);
  assert.deepEqual(ok.posts, [{ targetStatus: 'completed_returned' }]);
  const ignored = await runGuard(
    canceled,
    'completed_returned',
    management,
    undefined,
    [],
    (o) => o,
  );
  assert.equal(ignored.result.error?.status, 'STATUS_UNCERTAIN');
});

test('external partial returns open on delivered, delivered_with_return and completed', () => {
  const delivered = { ...external, isCredited: true };
  for (const [oliveryStatus, open] of [
    ['delivered', true],
    ['تم التسليم', true],
    ['delivered_with_return', true],
    ['completed', true],
    ['picked_up', false],
    ['rejected', false],
  ] as const)
    assert.equal(
      externalReturnReason({ ...delivered, oliveryStatus }, management, 'external') === null,
      open,
      oliveryStatus,
    );
});
