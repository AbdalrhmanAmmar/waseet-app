import assert from 'node:assert/strict';
import test from 'node:test';
import { product } from '../src/api/normalizers';
import {
  mediaUrl,
  optionalPrice,
  suggestedPrice,
  updatedDate,
} from '../src/domain/product-details';
test('product prices retain missing suggested price, genuine zero, media and description without inventing category', () => {
  const item = product({
    productCode: 104,
    quantity: 12,
    merchantSellPrice: '25',
    expectedSellPrice: null,
    videoUrl: '/uploads/demo.mp4',
    productDescription: 'وصف كامل',
    imageUrl: '/uploads/demo.png',
  });
  assert.equal(suggestedPrice(item), null);
  assert.equal(item.price, 25);
  assert.equal(item.merchantSellPrice, 25);
  assert.equal(item.categoryProvided, false);
  assert.equal(item.description, 'وصف كامل');
  assert.match(item.videoUrl!, /\/uploads\/demo.mp4$/);
  assert.match(item.image!, /^https:/);
  assert.equal(suggestedPrice(product({ expectedSellPrice: 0 })), 0);
  assert.ok(Number.isNaN(product({}).price));
  assert.equal(optionalPrice(''), null);
  assert.equal(optionalPrice('NaN'), null);
  assert.equal(mediaUrl('javascript:alert(1)'), undefined);
  assert.equal(updatedDate('invalid'), undefined);
});
