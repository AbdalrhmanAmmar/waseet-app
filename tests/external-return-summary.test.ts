import test from 'node:test';
import assert from 'node:assert/strict';
import { orderDetails } from '../src/api/normalizers';
import { externalReturnSummary } from '../src/domain/external-return-summary';
const order = orderDetails(
  {
    orderId: 1,
    status: 'Delivered',
    userId: 7,
    totalMerchantProfitUSD: 6,
    isCredited: true,
    isStockDecremented: true,
    items: [{ orderItemId: 11, quantity: 3, merchantProfitUSD: 6, adminProfitUSD: -3 }],
  },
  1,
);
const input = { items: [{ orderItemId: 11, quantity: 2 }] };
test('external settlement prorates stored profits and restores only previously deducted stock', () => {
  assert.deepEqual(externalReturnSummary(order, input), {
    pieces: 2,
    merchant: 4,
    admin: -2,
    stock: 2,
  });
  assert.equal(externalReturnSummary({ ...order, isStockDecremented: false }, input).stock, 0);
  assert.equal(
    externalReturnSummary({ ...order, isStockDecremented: undefined }, input).stock,
    null,
  );
});
test('missing financial flags and amounts stay unknown instead of becoming zero', () => {
  assert.equal(
    externalReturnSummary({ ...order, totalMerchantProfitUSD: undefined }, input).merchant,
    null,
  );
  assert.equal(externalReturnSummary({ ...order, userId: null }, input).merchant, null);
  assert.equal(
    externalReturnSummary({ ...order, items: [{ ...order.items[0], adminProfitUSD: null }] }, input)
      .admin,
    null,
  );
  assert.equal(order.isCredited, true);
  assert.equal(
    orderDetails(
      { orderId: 2, status: 'Delivered', items: [], is_credited: false, IsStockDecremented: false },
      2,
    ).isCredited,
    false,
  );
  assert.equal(
    orderDetails({ orderId: 2, status: 'Delivered', items: [] }, 2).isStockDecremented,
    undefined,
  );
});
