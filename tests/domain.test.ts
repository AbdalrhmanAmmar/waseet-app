import assert from 'node:assert/strict';
import test from 'node:test';
import { order, page, product } from '../src/api/normalizers';
import { can, isAccountRestricted } from '../src/auth/permissions';
import { ROLES, normalizeRole, rolePaths } from '../src/auth/roles';
import { normalizeUser } from '../src/auth/session';
import cart, {
  addToCartLocal,
  clearCartLocal,
  removeFromCartLocal,
  updateCartItemPriceLocal,
  updateCartQuantityLocal,
} from '../src/store/slices/cart';

test('all roles have distinct destinations, legacy Sales is normalized, unknown roles fail closed', () => {
  assert.equal(new Set(Object.values(rolePaths)).size, 4);
  for (const role of ROLES) assert.equal(normalizeRole(` ${role.toLowerCase()} `), role);
  assert.equal(normalizeRole('Sales'), 'SalesEmployee');
  for (const invalid of ['Admin', '', null, {}, '__proto__'])
    assert.equal(normalizeRole(invalid), null);
});
test('role permissions separate catalog, profits and order actions', () => {
  assert.equal(can('Merchant', 'profit.read'), true);
  assert.equal(can('SalesEmployee', 'profit.read'), false);
  assert.equal(can('Merchant', 'orders.status'), false);
  assert.equal(can('DeliveryAgent', 'orders.create'), false);
  assert.equal(can('DeliveryAgent', 'orders.status'), true);
  assert.equal(can('ManagementEmployee', 'catalog.read'), false);
  assert.equal(can(null, 'orders.status'), false);
});
test('pending, blocked and inactive accounts cannot enter work routes', () => {
  for (const accountStatus of [
    'Pending',
    'Blocked',
    'Suspended',
    'Rejected',
    'Inactive',
    'Disabled',
  ])
    assert.equal(isAccountRestricted({ accountStatus }), true);
  assert.equal(isAccountRestricted({ accountStatus: 'Approved' }), false);
});
test('sessions require a recognized role, token and user ID', () => {
  assert.throws(() => normalizeUser({ role: 'Root', token: 'test', userId: 1 }));
  assert.throws(() => normalizeUser({ role: 'Merchant', userId: 1 }));
  const user = normalizeUser({ id: 3, role: 'sales', token: 'test' });
  assert.equal(user.role, 'SalesEmployee');
  assert.equal(user.userId, 3);
  assert.equal(normalizeUser({ firstName: 'Updated' }, user).token, 'test');
});
test('API pages retain pagination and never fall back to fictitious records', () => {
  const result = page(
    {
      data: {
        items: [{ productCode: 2, name: 'A', quantity: 5, price: 0 }],
        totalCount: 25,
        pageSize: 10,
      },
    },
    { page: 2 },
    product,
  );
  assert.equal(result.totalPages, 3);
  assert.equal(result.page, 2);
  assert.equal(result.items[0].price, 0);
  assert.deepEqual(page({}, {}, product).items, []);
  assert.equal(order({ orderId: 1, orderTotalUSD: 0, totalPrice: 100 }).orderTotalUSD, 0);
  assert.deepEqual(order({ id: 1 }).items, []);
});
test('cart caps stock, rejects negative/non-finite prices, calculates totals and clears', () => {
  let state = cart(undefined, addToCartLocal({ productCode: 1, name: 'A', stock: 2, price: 10 }));
  state = cart(state, addToCartLocal({ productCode: 1, name: 'A', stock: 2, price: 10 }));
  state = cart(state, addToCartLocal({ productCode: 1, name: 'A', stock: 2, price: 10 }));
  assert.equal(state.userCart.data[0].quantity, 2);
  assert.equal(state.userCart.totalPrice, 20);
  state = cart(state, updateCartItemPriceLocal({ cart_id: '1', sellingPrice: -5 }));
  assert.equal(state.userCart.totalPrice, 20);
  state = cart(state, updateCartQuantityLocal({ cart_id: '1', quantity: 99 }));
  assert.equal(state.userCart.data[0].quantity, 2);
  state = cart(state, updateCartItemPriceLocal({ cart_id: '1', sellingPrice: 0 }));
  assert.equal(state.userCart.totalPrice, 0);
  state = cart(state, removeFromCartLocal('1'));
  assert.deepEqual(state.userCart.data, []);
  assert.deepEqual(cart(state, clearCartLocal()).userCart.data, []);
});
test('out-of-stock products do not enter the cart', () => {
  const state = cart(undefined, addToCartLocal({ productCode: 1, name: 'A', stock: 0, price: 10 }));
  assert.equal(state.userCart.data.length, 0);
});
