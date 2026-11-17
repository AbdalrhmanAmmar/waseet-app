import assert from 'node:assert/strict';
import test from 'node:test';
import { configureStore } from '@reduxjs/toolkit';
import { client } from '../src/api/client';
import { catalogApi, refreshProductDetails } from '../src/api/shared/catalog';

test('details refresh starts without a subscription, survives cache reset, and keeps API errors in query state', async () => {
  const store = configureStore({
    reducer: {
      [catalogApi.reducerPath]: catalogApi.reducer,
      AuthSlice: () => ({ userData: { role: 'Merchant' } }),
    },
    middleware: (defaults) => defaults().concat(catalogApi.middleware),
  });
  const adapter = client.defaults.adapter;
  let fail = false;
  let calls = 0;
  client.defaults.adapter = async (config) => {
    calls++;
    assert.equal(config.url, 'Product/104');
    if (fail) throw { response: { status: 503, data: { message: 'Unavailable' } }, config };
    return {
      data: { data: { productCode: 104, name: 'منتج', quantity: 5, merchantSellPrice: 30 } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  const args = { product_id: '104', user_id: 7 };
  try {
    assert.equal(
      catalogApi.endpoints.productDetails.select(args)(store.getState()).isUninitialized,
      true,
    );
    const first = await store.dispatch(refreshProductDetails(args));
    assert.equal(first.data?.stock, 5);
    store.dispatch(catalogApi.util.resetApiState());
    const second = await store.dispatch(refreshProductDetails(args));
    assert.equal(second.data?.merchantSellPrice, 30);
    fail = true;
    const failure = await store.dispatch(refreshProductDetails(args));
    assert.equal(failure.isError, true);
    assert.equal(catalogApi.endpoints.productDetails.select(args)(store.getState()).isError, true);
    assert.equal(calls, 3);
  } finally {
    store.dispatch(catalogApi.util.resetApiState());
    client.defaults.adapter = adapter;
  }
});

test('details are filtered by the logged-in role: no merchant price without the Merchant role', async () => {
  const adapter = client.defaults.adapter;
  client.defaults.adapter = async (config) => ({
    data: {
      data: {
        productCode: 104,
        name: 'منتج',
        quantity: 5,
        originalPrice: 20,
        merchantSellPrice: 30,
        expectedSellPrice: 40,
      },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
  try {
    for (const [role, merchant, cost] of [
      ['MerchantEmployee', undefined, 20],
      ['SalesEmployee', undefined, undefined],
      [undefined, undefined, 20],
    ] as const) {
      const store = configureStore({
        reducer: {
          [catalogApi.reducerPath]: catalogApi.reducer,
          AuthSlice: () => ({ userData: role ? { role } : null }),
        },
        middleware: (defaults) => defaults().concat(catalogApi.middleware),
      });
      const result = await store.dispatch(refreshProductDetails({ product_id: '104', user_id: 7 }));
      assert.equal(result.data?.merchantSellPrice, merchant, String(role));
      assert.equal(result.data?.originalPrice, cost, String(role));
      assert.equal(result.data?.expectedSellPrice, 40);
    }
  } finally {
    client.defaults.adapter = adapter;
  }
});
