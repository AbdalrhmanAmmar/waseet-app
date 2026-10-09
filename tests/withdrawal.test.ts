import test from 'node:test';
import assert from 'node:assert/strict';
import {
  amountCents,
  balanceCents,
  withdrawalError,
  withdrawalFormErrors,
  withdrawalRequestSchema,
} from '../src/domain/withdrawal';

test('withdrawal amounts support Arabic numerals and exact cents', () => {
  assert.equal(amountCents('١٢٣٫٤٥'), 12345);
  assert.equal(amountCents('۱۲۳.۴۵'), 12345);
  assert.equal(amountCents(' 12,30 '), 1230);
  assert.equal(amountCents('0.29'), 29);
  for (const value of ['', '-1', 'Infinity', '1e3', '1.001', '1,000', 'abc', '9007199254740991'])
    assert.equal(amountCents(value), null, value);
});
test('withdrawals require confirmed balance and strictly positive amount within it', () => {
  assert.ok(withdrawalError('0', 10));
  assert.ok(withdrawalError('10.01', 10));
  assert.ok(withdrawalError('1', null));
  assert.ok(withdrawalError('1', ''));
  assert.equal(withdrawalError('10', 10), null);
  assert.equal(withdrawalError('0.29', 0.29), null);
  assert.equal(balanceCents(1.239), 123);
  assert.equal(balanceCents(-1), null);
});

test('withdrawal Zod validation requires and trims the note with an Arabic error', () => {
  assert.equal(withdrawalFormErrors('10', 20, '').note, 'ملاحظة طلب السحب مطلوبة');
  assert.equal(withdrawalFormErrors('10', 20, '   ').note, 'ملاحظة طلب السحب مطلوبة');
  assert.deepEqual(withdrawalFormErrors('10', 20, ' سبب السحب '), {});
  assert.deepEqual(withdrawalRequestSchema.parse({ amount: 10, note: ' سبب السحب ' }), {
    amount: 10,
    note: 'سبب السحب',
  });
});
