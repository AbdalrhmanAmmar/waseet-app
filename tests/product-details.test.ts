import assert from 'node:assert/strict';
import test from 'node:test';
import { product } from '../src/api/normalizers';
import {
  mediaUrl,
  optionalPrice,
  suggestedPrice,
  updatedDate,
} from '../src/domain/product-details';
import cart, { setCartProductLocal, updateCartItemPriceLocal } from '../src/store/slices/cart';
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
test('details atomically saves desired cart quantity and exact displayed total, caps stock and preserves chosen sale price', () => {
  const item = product({
    productCode: 104,
    quantity: 3,
    merchantSellPrice: 25,
    expectedSellPrice: 35,
  });
  let state = cart(
    undefined,
    setCartProductLocal({ product: item, quantity: 2, sellingPrice: 35 }),
  );
  assert.equal(state.userCart.totalPrice, 70);
  state = cart(state, setCartProductLocal({ product: item, quantity: 2, sellingPrice: 35 }));
  assert.equal(state.userCart.data[0].quantity, 2);
  assert.equal(product(state.userCart.data[0]).stock, 3);
  state = cart(state, updateCartItemPriceLocal({ cart_id: '104', sellingPrice: 40 }));
  state = cart(
    state,
    setCartProductLocal({
      product: item,
      quantity: 3,
      sellingPrice: state.userCart.data[0].sellingPrice,
    }),
  );
  assert.equal(state.userCart.totalPrice, 120);
  for (const [quantity, sellingPrice] of [
    [4, 35],
    [1, -1],
    [1, NaN],
    [1.5, 35],
  ])
    state = cart(state, setCartProductLocal({ product: item, quantity, sellingPrice }));
  assert.equal(state.userCart.totalPrice, 120);
  state = cart(state, setCartProductLocal({ product: item, quantity: 0, sellingPrice: 40 }));
  assert.equal(state.userCart.data.length, 0);
});
