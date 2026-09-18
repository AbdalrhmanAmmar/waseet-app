import assert from 'node:assert/strict';
import test from 'node:test';
import {
  draftItem,
  emptyOrder,
  orderPayload,
  orderSubtotal,
  validateOrder,
} from '../src/domain/order-draft';
import { product } from '../src/api/normalizers';
const areas = [{ deliveryAreaId: 1, city: 'دمشق', fee: 3 }];
const good = () => ({
  ...emptyOrder(),
  customerName: ' عميل جديد ',
  customerMobile: '٠٩١٢٣٤٥٦٧٨',
  customerArea: 'دمشق',
  customerAddress: ' شارع اختبار ',
  items: [
    {
      ...draftItem(
        product({
          productCode: 8,
          name: 'منتج',
          quantity: 3,
          expectedSellPrice: 15,
          merchantSellPrice: 10,
        }),
      ),
      quantity: '٢',
      price: '١٧٫٥٠',
      color: ' أسود ',
    },
  ],
});
test('order payload includes trimmed required color, normalized Arabic numbers and edited selling price', () => {
  const draft = good();
  assert.deepEqual(validateOrder(draft, areas), {});
  assert.equal(orderSubtotal(draft), 35);
  assert.deepEqual(orderPayload(draft), {
    customerName: 'عميل جديد',
    customerMobile: '0912345678',
    customerArea: 'دمشق',
    customerAddress: 'شارع اختبار',
    items: [{ productCode: 8, quantity: 2, actualSellPriceUSD: 17.5, color: 'أسود' }],
  });
});
test('order validation rejects missing color, duplicate products, invalid quantities and unavailable delivery fees', () => {
  let draft = good();
  draft.items[0].color = '  ';
  assert.ok(validateOrder(draft, areas)['items.8.color']);
  draft = good();
  draft.items.push({ ...draft.items[0] });
  assert.ok(validateOrder(draft, areas)['items.8.product']);
  for (const quantity of ['4', '0', '-1', '1.5', 'NaN']) {
    draft = good();
    draft.items[0].quantity = quantity;
    assert.ok(validateOrder(draft, areas)['items.8.quantity']);
  }
  for (const price of ['', '0', '-1', 'NaN', '1.111']) {
    draft = good();
    draft.items[0].price = price;
    assert.ok(validateOrder(draft, areas)['items.8.price']);
  }
  draft = good();
  draft.customerMobile = '0812345678';
  assert.ok(validateOrder(draft, areas).customerMobile);
  assert.ok(validateOrder(good(), [{ ...areas[0], fee: null }]).customerArea);
  assert.ok(validateOrder(good(), []).customerArea);
  draft = good();
  draft.items = [];
  assert.ok(validateOrder(draft, areas).items);
});
test('draft price uses API suggested then merchant price, never invents zero for missing data', () => {
  assert.equal(
    draftItem(
      product({ productCode: 8, quantity: 1, expectedSellPrice: 15, merchantSellPrice: 10 }),
    ).price,
    '15',
  );
  assert.equal(
    draftItem(product({ productCode: 8, quantity: 1, merchantSellPrice: 10 })).price,
    '10',
  );
  assert.equal(draftItem(product({ productCode: 8, quantity: 1 })).price, '');
});
