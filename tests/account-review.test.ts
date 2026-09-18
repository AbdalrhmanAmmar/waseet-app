import assert from 'node:assert/strict';
import test from 'node:test';
import { accountReview } from '../src/auth/account-review';
import { normalizeUser } from '../src/auth/session';

test('review metadata accepts only explicit user-facing fields, never internal notes or credentials', () => {
  assert.deepEqual(
    accountReview({
      data: {
        user: {
          userId: 7,
          firstName: ' أحمد ',
          accountStatus: 'Rejected',
          rejectionReason: ' بيانات ناقصة ',
          token: 'secret',
          notes: 'internal',
        },
      },
    }),
    {
      accountStatus: 'Rejected',
      firstName: 'أحمد',
      userId: '7',
      rejectionReason: 'بيانات ناقصة',
    },
  );
  const absent = accountReview({
    message: 'Server error',
    reason: 'Internal',
    rejectionReason: ' ',
    userId: {},
    firstName: [],
  });
  assert.equal(absent.rejectionReason, undefined);
  assert.equal(absent.userId, undefined);
  assert.equal(absent.firstName, undefined);
});

test('profile refresh removes an old rejection reason when the server omits it', () => {
  const previous = normalizeUser({
    userId: 7,
    role: 'Merchant',
    token: 'test',
    accountStatus: 'Rejected',
    rejectionReason: 'Old reason',
  });
  const refreshed = normalizeUser({ userId: 7, accountStatus: 'Rejected' }, previous);
  assert.equal(accountReview(refreshed).rejectionReason, undefined);
  assert.equal(refreshed.token, 'test');
});
