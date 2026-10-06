import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUser } from '../src/auth/session';
import { normalizeRole, rolePaths, PUBLIC_ROLES, isMerchantRole } from '../src/auth/roles';
import { can } from '../src/auth/permissions';
import { actorFromUser, internalTargets } from '../src/domain/internal-order-policy';
import { orderDetails } from '../src/api/normalizers';
test('employee login, hydration and profile refresh preserve employee identity and owner separately', () => {
  const user = normalizeUser({
    userId: 144,
    role: 'MerchantEmployee',
    ownerMerchantId: 163,
    accountStatus: 'Approved',
    dollarBalance: null,
    token: 'mock-employee-token',
  });
  for (const session of [
    user,
    normalizeUser(user),
    normalizeUser({ userId: 144, firstName: 'Ahmed' }, user),
  ]) {
    assert.equal(session.role, 'MerchantEmployee');
    assert.equal(session.userId, 144);
    assert.equal(session.ownerMerchantId, 163);
    assert.equal(session.token, 'mock-employee-token');
    assert.equal(rolePaths[session.role], '/merchant');
    assert.equal(isMerchantRole(session.role), true);
    assert.equal(can(session.role, 'profit.read'), true);
    assert.equal(can(session.role, 'orders.edit'), false);
  }
  assert.equal(normalizeRole(' merchantemployee '), 'MerchantEmployee');
  assert.ok(!(PUBLIC_ROLES as readonly string[]).includes('MerchantEmployee'));
});
test('employee uses owner only for order ownership and does not gain management transitions', () => {
  const user = normalizeUser({
    userId: 144,
    role: 'MerchantEmployee',
    ownerMerchantId: 163,
    token: 'mock',
  });
  const order = orderDetails(
    {
      orderId: 1,
      userId: 163,
      status: 'Stuck',
      orderType: 'Normal',
      oliveryOrderId: null,
      items: [],
    },
    1,
  );
  assert.ok(internalTargets(order, actorFromUser(user), 'internal').includes('Processing'));
  assert.ok(
    !internalTargets({ ...order, userId: 999 }, actorFromUser(user), 'internal').includes(
      'Processing',
    ),
  );
  assert.ok(
    !internalTargets({ ...order, status: 'Processing' }, actorFromUser(user), 'internal').includes(
      'Confirmed',
    ),
  );
});
