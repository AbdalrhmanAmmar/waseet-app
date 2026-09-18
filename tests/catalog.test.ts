import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultFilters,
  filterProducts,
  normalizeNumber,
  priceRangeError,
} from '../src/components/shared/catalog/catalog-model';
import { product } from '../src/api/normalizers';
const items = [
  product({
    id: 1,
    name: 'إبريق أخضر',
    productCode: 'WS-208',
    price: 28,
    quantity: 3,
    category: 'المنزل',
  }),
  product({
    id: 2,
    name: 'سماعات',
    productCode: 'WS-104',
    price: 35,
    effectiveExpectedSellPrice: 20,
    quantity: 0,
    category: 'إلكترونيات',
  }),
];
test('catalog searches normalized Arabic and product codes, sorts and filters by displayed price without mutating input', () => {
  assert.equal(filterProducts(items, ' ابريق ', defaultFilters)[0].productCode, 'WS-208');
  assert.equal(filterProducts(items, 'ws-104', defaultFilters)[0].title, 'سماعات');
  assert.deepEqual(
    filterProducts(items, '', { ...defaultFilters, available: true }).map((p) => p.productCode),
    ['WS-208'],
  );
  assert.equal(
    filterProducts(items, '', { ...defaultFilters, max: '25' })[0].productCode,
    'WS-104',
  );
  assert.equal(
    filterProducts(items, '', { ...defaultFilters, sort: 'price_asc' })[0].productCode,
    'WS-104',
  );
  assert.equal(items[0].productCode, 'WS-208');
  assert.equal(
    filterProducts(items, '', { ...defaultFilters, category: 'المنزل', min: '30' }).length,
    0,
  );
});
test('price filters accept Arabic digits and reject invalid or inverted ranges', () => {
  assert.equal(normalizeNumber('٢٥٫٥'), '25.5');
  assert.equal(normalizeNumber('۱۲'), '12');
  assert.equal(priceRangeError({ ...defaultFilters, min: '0', max: '50' }), '');
  for (const [min, max] of [
    ['-1', ''],
    ['NaN', ''],
    ['100', '20'],
  ])
    assert.ok(priceRangeError({ ...defaultFilters, min, max }));
});
