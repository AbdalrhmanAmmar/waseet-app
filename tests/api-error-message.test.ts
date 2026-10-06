import test from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage } from '../src/domain/api-error-message';
test('validation details survive generic summaries and problem titles', () => {
  assert.equal(
    apiErrorMessage(
      { message: 'Failed', errors: { Email: ['Already used'], Password: ['Too short'] } },
      'fallback',
    ),
    'Failed\nAlready used\nToo short',
  );
  assert.equal(
    apiErrorMessage(
      {
        title: 'Validation failed',
        errors: [{ code: 'PasswordTooShort', description: 'Too short' }],
      },
      'fallback',
    ),
    'Too short',
  );
});
test('messages preserve server rejection while malformed bodies remain safe', () => {
  assert.equal(apiErrorMessage({ message: 'Rejected' }, 'fallback'), 'Rejected');
  assert.equal(
    apiErrorMessage({ password: 'secret', errors: [{ password: 'secret' }] }, 'fallback'),
    'fallback',
  );
  assert.equal(apiErrorMessage(null, 'fallback'), 'fallback');
  assert.equal(apiErrorMessage({ message: 'Same', errors: ['Same'] }, 'fallback'), 'Same');
});
