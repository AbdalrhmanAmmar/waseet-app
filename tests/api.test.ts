import assert from 'node:assert/strict';
import test from 'node:test';
import { client, configureSession } from '../src/api/client';

test('authenticated requests carry a token without persisting it in URL parameters', async () => {
  configureSession('test-token');
  const response = await client.get('orders', {
    adapter: async (config) => {
      assert.equal(config.headers.Authorization, 'Bearer test-token');
      assert.equal(config.params, undefined);
      return { data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config };
    },
  });
  assert.deepEqual(response.data, { data: [] });
});
test('server-declared failure cannot be displayed as success', async () => {
  await assert.rejects(
    client.post(
      'orders',
      {},
      {
        adapter: async (config) => ({
          data: { isSuccess: false, message: 'Rejected' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      },
    ),
    (error) => (error as { message: string }).message === 'Rejected',
  );
});
test('only an unauthorized request from the current session invalidates it', async () => {
  let expired = 0;
  configureSession('new-token', () => expired++);
  const adapter = async (config: any) => {
    throw { response: { status: 401 }, config };
  };
  await assert.rejects(client.get('orders', { adapter }));
  assert.equal(expired, 1);
  await assert.rejects(client.post('Auth/login', {}, { adapter }));
  assert.equal(expired, 1);
  await assert.rejects(
    client.get('orders', {
      adapter: async (config) => {
        configureSession('newer-token');
        throw { response: { status: 401 }, config };
      },
    }),
  );
  assert.equal(expired, 1);
  configureSession(null);
});

test('dashboard success:false envelope rejects order submission', async () => {
  await assert.rejects(
    client.post(
      'orders',
      {},
      {
        adapter: async (config) => ({
          data: { success: false, message: 'Color required' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      },
    ),
    (error) => (error as { message: string }).message === 'Color required',
  );
});
