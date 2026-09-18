import assert from 'node:assert/strict';
import test from 'node:test';
import { loginRestriction } from '../src/auth/login-restriction';
test('explicit login restriction messages select presentation without accepting ordinary failures', () => {
  for (const message of [
    'Your account is pending',
    'Your account is pending approval.',
    'Your account is still pending approval.',
    'Account status is Pending',
    'Your account is awaiting approval.',
    'حسابك قيد المراجعة',
    'الحساب بانتظار الموافقة',
    'Your account is not yet approved.',
    'Your account has not been approved yet.',
    'لم تتم الموافقة على حسابك بعد',
  ])
    assert.equal(loginRestriction(message), 'Pending', message);
  assert.equal(loginRestriction('Your account has been blocked.'), 'Blocked');
  assert.equal(loginRestriction('Your account is suspended.'), 'Suspended');
  for (const message of [
    'Invalid email or password',
    'Payment pending',
    'Network Error',
    'Request pending',
    'بيانات الدخول غير صحيحة',
  ])
    assert.equal(loginRestriction(message), null, message);
});

test('rejected review messages and explicit status select rejection without confusing pending', () => {
  for (const message of [
    'Your account is rejected.',
    'Your account has not been approved.',
    'لم تتم الموافقة على حسابك',
    'تم رفض حسابك',
  ])
    assert.equal(loginRestriction(message), 'Rejected', message);
  assert.equal(loginRestriction('Your account is pending', 'Rejected'), 'Rejected');
  assert.equal(loginRestriction('Your account is not approved', 'Pending'), 'Pending');
  assert.equal(loginRestriction('Invalid password', 'unknown'), null);
});
