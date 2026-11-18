import assert from 'node:assert/strict';
import test from 'node:test';
import type { AxiosRequestConfig } from 'axios';
import { normalizeUser } from '../src/auth/session';
import { loginUser, withdrawnUpdate } from '../src/domain/balance';
import { merchantAccess } from '../src/domain/merchant-access';
import {
  readMerchantWithdrawals,
  withdrawalFilterError,
  withdrawalPresentation,
  withdrawalTotal,
} from '../src/domain/merchant-finance';
import { readMerchantEmployee, readMerchantEmployees } from '../src/domain/employee-management';
import { guardedEmployeeAction, verifyEmployeeAction } from '../src/api/merchant/employee-guards';
import type { User } from '../src/types/models';
const actor: User = { userId: 7, role: 'Merchant', token: 'mock', accountStatus: 'Approved' };
const employee = {
  userId: 88,
  role: 'MerchantEmployee',
  ownerMerchantId: 7,
  firstName: 'محمد',
  lastName: 'أحمد',
  email: 'employee@example.com',
  accountStatus: 'Pending',
};
const request = {
  withdrawalRequestId: 10,
  merchantUserId: 7,
  amount: 12.25,
  status: 'Approved',
  requestedAt: '2026-11-17T12:00:00Z',
};
test('withdrawn total preserves genuine zero, rejects invalid or absent amounts and updates independently from balance', () => {
  for (const raw of [
    { totalPaidUSD: 0 },
    { withdrawnAmount: 0 },
    { totalWithdrawnAmount: '0' },
    { AmountWithdrawn: 0 },
  ])
    assert.equal(withdrawnUpdate(raw).withdrawnAmount, 0);
  for (const raw of [
    {},
    { withdrawnAmount: null },
    { withdrawnAmount: '' },
    { withdrawnAmount: -1 },
    { withdrawnAmount: 'invalid' },
  ])
    assert.equal(withdrawnUpdate(raw).withdrawnAmount, null);
  const user = normalizeUser(
    loginUser({ user: actor, dollarBalance: 100, withdrawnAmount: '3500.25' }),
  );
  assert.equal(user.withdrawnAmount, 3500.25);
  assert.equal(
    normalizeUser(loginUser({ user: actor, token: 'mock', totalPaidUSD: 10 })).withdrawnAmount,
    10,
  );
  assert.equal(withdrawnUpdate({ totalPaidUSD: 10, withdrawnAmount: null }).withdrawnAmount, 10);
  const refreshed = normalizeUser({ userId: 7, dollarBalance: 100 }, user);
  assert.equal(refreshed.withdrawnAmount, null);
  assert.equal(refreshed.withdrawnStale, true);
  assert.equal(refreshed.dollarBalance, 100);
});
test('merchant finance rejects foreign, duplicate and incomplete histories; unknown values are not invented', () => {
  const rows = readMerchantWithdrawals(
    {
      data: [
        request,
        {
          ...request,
          withdrawalRequestId: 11,
          amount: null,
          status: 'FutureState',
          requestedAt: '2026-11-18T12:00:00Z',
        },
      ],
    },
    '7',
  );
  assert.deepEqual(
    rows.map((row) => row.id),
    ['11', '10'],
  );
  assert.equal(rows[0].amount, null);
  assert.equal(withdrawalTotal(rows), null);
  assert.equal(withdrawalTotal(rows.slice(1)), 12.25);
  assert.deepEqual(withdrawalPresentation('FutureState'), {
    label: 'FutureState',
    tone: 'neutral',
  });
  assert.throws(() =>
    readMerchantWithdrawals({ data: [request, { ...request, merchantUserId: 9 }] }, '7'),
  );
  assert.throws(() => readMerchantWithdrawals({ data: [request, request] }, '7'));
  assert.throws(() =>
    readMerchantWithdrawals({ data: { items: [request], totalCount: 2, totalPages: 2 } }, '7'),
  );
  assert.ok(withdrawalFilterError({ fromDate: '2026-02-30' }));
  assert.ok(withdrawalFilterError({ fromDate: '2026-11-18', toDate: '2026-11-01' }));
  assert.equal(withdrawalFilterError({ fromDate: '2026-11-01', toDate: '2026-11-18' }), null);
});
test('employee responses check identity and explicit owner/role while accepting older scoped rows without ownership metadata', () => {
  assert.equal(readMerchantEmployees({ data: [employee] }, '7')[0].name, 'محمد أحمد');
  const { ownerMerchantId: _owner, role: _role, ...scoped } = employee;
  assert.equal(readMerchantEmployees({ data: [scoped] }, '7')[0].id, '88');
  assert.throws(() => readMerchantEmployees({ data: [{ ...employee, ownerMerchantId: 9 }] }, '7'));
  assert.throws(() =>
    readMerchantEmployees({ data: [{ ...employee, role: 'SalesEmployee' }] }, '7'),
  );
  assert.throws(() => readMerchantEmployee({ data: employee }, '7', '99'));
});
test('only an active merchant can administer their employees, before any read or write', async () => {
  for (const role of [
    'MerchantEmployee',
    'SalesEmployee',
    'ManagementEmployee',
    'DeliveryAgent',
    'Admin',
  ]) {
    const user = { ...actor, role } as User;
    assert.equal(merchantAccess(user, '7'), false);
    const response = await guardedEmployeeAction(
      { merchantId: '7', employeeId: '88', action: 'Approved', expectedStatus: 'Pending' },
      () => {
        assert.fail('must not contact server');
      },
      user,
    );
    assert.ok(response.error);
  }
  assert.equal(merchantAccess({ ...actor, accountStatus: 'Rejected' }, '7'), false);
  assert.equal(merchantAccess(actor, '9'), false);
});
test('employee approval sends PUT with query status and no body, verifies fresh state and survives a lost write response', async () => {
  const row = { ...employee };
  const writes: AxiosRequestConfig[] = [];
  const query = async (args: AxiosRequestConfig) => {
    if (args.method) {
      writes.push(args);
      row.accountStatus = String(args.params.status);
      return { error: { status: 503, message: 'lost response' } };
    }
    return { data: { data: args.url === 'User/employees' ? [row] : row } };
  };
  const response = await guardedEmployeeAction(
    { merchantId: '7', employeeId: '88', action: 'Approved', expectedStatus: 'Pending' },
    query,
    actor,
  );
  assert.ok(!response.error);
  assert.deepEqual(writes, [
    { url: 'User/employees/88/status', method: 'PUT', params: { status: 'Approved' } },
  ]);
});
test('stale status, foreign membership and switched sessions stop employee mutations', async () => {
  for (const mode of ['stale', 'foreign', 'session']) {
    let writes = 0;
    const query = (args: AxiosRequestConfig) => {
      if (args.method) writes++;
      return {
        data: {
          data:
            args.url === 'User/employees'
              ? mode === 'foreign'
                ? []
                : [employee]
              : { ...employee, accountStatus: mode === 'stale' ? 'Rejected' : 'Pending' },
        },
      };
    };
    const response = await guardedEmployeeAction(
      { merchantId: '7', employeeId: '88', action: 'Approved', expectedStatus: 'Pending' },
      query,
      actor,
      () => mode !== 'session',
    );
    assert.ok(response.error);
    assert.equal(writes, 0);
  }
});
test('delete is successful only after absence from the scoped list and verification never repeats a write', async () => {
  let removed = false;
  let writes = 0;
  const query = (args: AxiosRequestConfig) => {
    if (args.method) {
      writes++;
      return { data: { isSuccess: true } };
    }
    return {
      data: { data: args.url === 'User/employees' ? (removed ? [] : [employee]) : employee },
    };
  };
  const input = {
    merchantId: '7',
    employeeId: '88',
    action: 'delete' as const,
    expectedStatus: 'Pending',
  };
  assert.equal(
    (await guardedEmployeeAction(input, query, actor)).error?.status,
    'EMPLOYEE_UNCERTAIN',
  );
  removed = true;
  assert.deepEqual((await verifyEmployeeAction(input, query, actor)).data, { deleted: true });
  assert.equal(writes, 1);
});
test('a concurrent employee action is blocked while the first write is pending', async () => {
  let release!: () => void;
  let submitted!: () => void;
  const ready = new Promise<void>((resolve) => {
    submitted = resolve;
  });
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const row = { ...employee };
  let writes = 0;
  const query = async (args: AxiosRequestConfig) => {
    if (args.method) {
      writes++;
      submitted();
      await wait;
      row.accountStatus = 'Approved';
    }
    return { data: { data: args.url === 'User/employees' ? [row] : row } };
  };
  const input = {
    merchantId: '7',
    employeeId: '88',
    action: 'Approved' as const,
    expectedStatus: 'Pending',
  };
  const first = guardedEmployeeAction(input, query, actor);
  await ready;
  assert.ok((await guardedEmployeeAction(input, query, actor)).error);
  release();
  assert.ok(!(await first).error);
  assert.equal(writes, 1);
});
