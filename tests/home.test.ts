import assert from 'node:assert/strict';
import test from 'node:test';
import { balanceNumber, loginUser, formatBalance } from '../src/domain/balance';
import { normalizeUser } from '../src/auth/session';
import {
  dailyOrders,
  periodBounds,
  orderPage,
  orderOutcome,
  outcomeCounts,
} from '../src/domain/home-orders';
import { order } from '../src/api/normalizers';
const account = { userId: 7, role: 'Merchant', token: 'test' };
test('login balances normalize nested and sibling fields while preserving zero and negative balances', () => {
  const outer = normalizeUser(
    loginUser({ user: account, dollarBalance: '1250.50', token: 'session' }),
  );
  assert.equal(outer.dollarBalance, 1250.5);
  assert.equal(outer.token, 'session');
  assert.equal(
    normalizeUser(loginUser({ user: { ...account, dollarBalance: 0 }, dollarBalance: 9 }))
      .dollarBalance,
    0,
  );
  assert.equal(normalizeUser({ ...account, dollarBalance: -3.25 }).dollarBalance, -3.25);
  assert.equal(formatBalance(0), '0.00');
  for (const value of [null, undefined, '', '  ', false, true, {}, [], Infinity, 'NaN'])
    assert.equal(balanceNumber(value), null);
});
test('missing or null profile balance keeps last known value explicitly stale and cannot turn it into zero', () => {
  const user = normalizeUser({ ...account, dollarBalance: 1250 });
  for (const raw of [{}, { dollarBalance: null }, { dollarBalance: 'invalid' }]) {
    const next = normalizeUser(raw, user);
    assert.equal(next.dollarBalance, 1250);
    assert.equal(next.balanceStale, true);
    assert.equal(next.balanceUpdatedAt, user.balanceUpdatedAt);
  }
  const zero = normalizeUser({ dollarBalance: 0 }, user);
  assert.equal(zero.dollarBalance, 0);
  assert.equal(zero.balanceStale, false);
  assert.equal(normalizeUser(account).dollarBalance, null);
});
test('daily order buckets cover calendar days across month boundaries and reject incomplete dates', () => {
  const now = new Date(2026, 8, 2, 12);
  const bounds = periodBounds(7, now);
  const start = new Date(bounds.from);
  assert.equal(start.getDate(), 27);
  assert.equal(start.getMonth(), 7);
  const values = [
    order({ orderId: 1, createdAt: new Date(2026, 7, 27, 13).toISOString() }),
    order({ orderId: 2, createdAt: now.toISOString() }),
  ];
  const buckets = dailyOrders(values, bounds.from, 7);
  assert.equal(buckets.length, 7);
  assert.equal(buckets[0].count, 1);
  assert.equal(buckets[6].count, 1);
  assert.throws(() => dailyOrders([order({ orderId: 3 })], bounds.from, 7));
  assert.throws(() => dailyOrders([order({ createdAt: '2020-01-01' })], bounds.from, 7));
  assert.throws(() => orderPage({ items: [], totalCount: 0 }));
  assert.equal(orderPage({ data: { items: [], totalCount: 0, totalPages: 0 } }).totalCount, 0);
});

test('home outcomes read the local status for internal orders and Olivery for shipped ones', () => {
  const cases: [Record<string, unknown>, string | null][] = [
    // Internal: local Order.Status is the source of truth.
    [{ status: 'Processing' }, 'processing'],
    [{ status: 'Delivered' }, 'delivered'],
    [{ status: 'Completed' }, 'delivered'],
    [{ status: 'Refused on Delivery' }, 'refused'],
    [{ status: 'Stuck' }, 'stuck'],
    [{ status: 'Cancelled' }, 'cancelled'],
    [{ status: 'Postponed' }, 'postponed'],
    [{ status: 'Out for Delivery' }, null],
    [{ status: 'Ready for Dispatch' }, null],
    [{ status: 'Completed_return' }, null],
    // External: Order.Status never reaches Delivered, the Olivery state does.
    [{ status: 'Printed Confirmed', oliveryStatus: 'delivered' }, 'delivered'],
    [{ status: 'In_Company', oliveryStatus: 'تم التسليم' }, 'delivered'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'delivered_with_return' }, 'delivered'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'paid' }, 'delivered'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'money_in' }, 'delivered'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'completed' }, 'delivered'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'rejected' }, 'refused'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'مرفوض' }, 'refused'],
    [{ status: 'Confirmed', oliveryStatus: 'stuck' }, 'stuck'],
    [{ status: 'Cancelled', oliveryStatus: 'canceled' }, 'cancelled'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'reschedule' }, 'postponed'],
    [{ status: 'Printed Confirmed', oliveryStatus: 'picked_up' }, null],
    [{ status: 'Confirmed', oliveryStatus: 'waiting' }, null],
    // Not yet shipped, or provider state not decisive: local status decides.
    [{ status: 'Stuck', oliveryStatus: null }, 'stuck'],
    [{ status: 'Cancelled', oliveryStatus: 'branch_returned' }, 'cancelled'],
    // Return orders are not sales outcomes.
    [{ status: 'Processing', orderType: 'Return' }, null],
  ];
  for (const [raw, expected] of cases)
    assert.equal(
      orderOutcome(order({ orderId: 1, orderType: 'Normal', ...raw })),
      expected,
      JSON.stringify(raw),
    );
  const counts = outcomeCounts(cases.map(([raw]) => order({ orderType: 'Normal', ...raw })));
  assert.deepEqual(counts, {
    processing: 1,
    delivered: 8,
    refused: 3,
    stuck: 3,
    cancelled: 3,
    postponed: 2,
  });
});
