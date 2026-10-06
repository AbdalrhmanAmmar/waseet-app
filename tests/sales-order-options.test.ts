import assert from 'node:assert/strict';
import test from 'node:test';
import { salesOrderOptions } from '../src/domain/sales-order-options';
import { draftItem, emptyOrder, validateOrder, orderPayload } from '../src/domain/order-draft';
const option = {
  productCode: 185208,
  name: 'test',
  originalPrice: 50,
  merchantSellPrice: 999,
  expectedSellPrice: 65,
  effectiveExpectedSellPrice: null,
};
test('sales contract excludes merchant price, preserves cost and expected prices, rejects malformed lists', () => {
  const [product] = salesOrderOptions({ isSuccess: true, data: [option, option] });
  assert.equal(product.originalPrice, 50);
  assert.equal(product.merchantSellPrice, undefined);
  assert.equal(product.stockKnown, false);
  assert.equal(draftItem(product).price, '65');
  assert.equal(salesOrderOptions([option, option]).length, 1);
  assert.equal(
    draftItem(salesOrderOptions([{ ...option, effectiveExpectedSellPrice: 70 }])[0]).price,
    '70',
  );
  assert.equal(draftItem(salesOrderOptions([{ ...option, expectedSellPrice: null }])[0]).price, '');
  assert.equal(
    draftItem(salesOrderOptions([{ ...option, effectiveExpectedSellPrice: 0 }])[0]).price,
    '0',
  );
  for (const body of [
    { data: {} },
    [null],
    [{ ...option, productCode: null }],
    [{ ...option, name: null }],
  ])
    assert.throws(() => salesOrderOptions(body));
});
test('sales order permits server-validated stock while enforcing quantity, price and color; merchant remains strict', () => {
  const draft = {
    ...emptyOrder(),
    customerName: 'عميل اختبار',
    customerMobile: '0912345678',
    customerArea: 'دمشق',
    customerAddress: 'شارع النصر',
    items: [{ ...draftItem(salesOrderOptions([option])[0]), quantity: '30', color: ' أسود ' }],
  };
  const areas = [{ deliveryAreaId: 1, city: 'دمشق', fee: 5 }];
  assert.deepEqual(validateOrder(draft, areas, 'server'), {});
  assert.ok(validateOrder(draft, areas)['items.185208.quantity']);
  assert.deepEqual(orderPayload(draft).items, [
    { productCode: 185208, quantity: 30, actualSellPriceUSD: 65, color: 'أسود' },
  ]);
  for (const qty of ['0', '-1', '1.2', 'NaN']) {
    draft.items[0].quantity = qty;
    assert.ok(validateOrder(draft, areas, 'server')['items.185208.quantity']);
  }
  draft.items[0].quantity = '1';
  draft.items[0].color = '';
  draft.items[0].price = '';
  const errors = validateOrder(draft, areas, 'server');
  assert.ok(errors['items.185208.color']);
  assert.ok(errors['items.185208.price']);
});
