import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('API modules can reload against the same base API during development', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '-e',
      `
        const assert = require('node:assert/strict');
        const { baseApi } = require('./src/api/base-api.ts');
        const files = [
          './src/api/shared/catalog.ts', './src/api/shared/orders.ts', './src/api/shared/home.ts',
          './src/api/shared/account.ts', './src/api/merchant/index.ts',
          './src/api/management-employee/index.ts', './src/api/delivery-agent/index.ts',
        ];
        const errors = [];
        console.error = (...args) => errors.push(args.join(' '));
        for (const file of files) require(file);
        const names = Object.keys(baseApi.endpoints).sort();
        assert.ok(names.includes('productDetails'));
        assert.ok(names.includes('orders'));
        for (const file of files) {
          delete require.cache[require.resolve(file)];
          require(file);
        }
        assert.equal(require('./src/api/base-api.ts').baseApi, baseApi);
        assert.deepEqual(Object.keys(baseApi.endpoints).sort(), names);
        assert.deepEqual(errors, []);
      `,
    ],
    { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'development' }, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
