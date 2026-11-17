import assert from 'node:assert/strict';
import test from 'node:test';
import { productForRole, seesMerchantPrice } from '../src/domain/product-visibility';
import { product } from '../src/api/normalizers';
import { draftItem, emptyOrder, validateOrder, orderPayload } from '../src/domain/order-draft';
// A Product/all row as the backend may still send it to any role.
const raw = {
  productCode: 185208,
  name: 'حقيبة يومية',
  categoryName: 'حقائب',
  imageUrl: 'https://cdn.example.com/bag.jpg',
  videoUrl: 'https://cdn.example.com/bag.mp4',
  description: 'وصف',
  quantity: 12,
  originalPrice: 50,
  merchantSellPrice: 58,
  MerchantSellPrice: 58,
  expectedSellPrice: 65,
  effectiveExpectedSellPrice: 70,
};
const PRICE_KEYS = ['merchantSellPrice', 'MerchantSellPrice', 'originalPrice'];

test('only the merchant sees the merchant price', () => {
  assert.equal(seesMerchantPrice('Merchant'), true);
  for (const role of ['MerchantEmployee', 'SalesEmployee', 'ManagementEmployee', 'DeliveryAgent'])
    assert.equal(seesMerchantPrice(role), false);
  assert.equal(productForRole(product(raw), 'Merchant').merchantSellPrice, 58);
});

test('merchant employee keeps everything except the merchant price', () => {
  const item = productForRole(product(raw), 'MerchantEmployee');
  assert.equal(item.merchantSellPrice, undefined);
  assert.equal(item.MerchantSellPrice, undefined);
  assert.ok(!JSON.stringify(item).includes('58'));
  assert.equal(item.effectiveExpectedSellPrice, 70);
  assert.equal(item.expectedSellPrice, 65);
  assert.equal(item.stock, 12);
  assert.equal(item.image, raw.imageUrl);
  assert.equal(draftItem(item).price, '70');
  // With no expected price the merchant price must not leak through `price` either.
  const bare = productForRole(
    product({ ...raw, expectedSellPrice: null, effectiveExpectedSellPrice: null }),
    'MerchantEmployee',
  );
  assert.ok(Number.isNaN(bare.price));
  assert.equal(draftItem(bare).price, '');
});

test('sales sees media, details and expectedSellPrice only', () => {
  const item = productForRole(product(raw), 'SalesEmployee');
  for (const key of [...PRICE_KEYS, 'effectiveExpectedSellPrice'])
    assert.equal(item[key], undefined, key);
  assert.ok(!JSON.stringify(item).includes('58'));
  assert.ok(!JSON.stringify(item).includes('"originalPrice"'));
  assert.equal(item.expectedSellPrice, 65);
  assert.equal(item.price, 65);
  assert.equal(item.image, raw.imageUrl);
  assert.equal(item.videoUrl, raw.videoUrl);
  assert.equal(item.category, 'حقائب');
  assert.equal(item.description, 'وصف');
  // The applied (effective) price is not shown to sales: the draft starts from expectedSellPrice.
  assert.equal(draftItem(item).price, '65');
  const noPrice = productForRole(product({ ...raw, expectedSellPrice: null }), 'SalesEmployee');
  assert.ok(Number.isNaN(noPrice.price));
  assert.equal(draftItem(noPrice).price, '');
});

test('sales order permits server-validated stock while enforcing quantity, price and color; merchant remains strict', () => {
  const draft = {
    ...emptyOrder(),
    customerName: 'عميل اختبار',
    customerMobile: '0912345678',
    customerArea: 'دمشق',
    customerAddress: 'شارع النصر',
    items: [
      {
        ...draftItem(productForRole(product(raw), 'SalesEmployee')),
        quantity: '30',
        color: ' أسود ',
      },
    ],
  };
  const areas = [{ deliveryAreaId: 1, isInternalDelivery: false, city: 'دمشق', fee: 5 }];
  assert.deepEqual(validateOrder(draft, areas, 'server'), {});
  assert.ok(validateOrder(draft, areas)['items.185208.quantity']);
  assert.deepEqual(orderPayload(draft, 'external').items, [
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
