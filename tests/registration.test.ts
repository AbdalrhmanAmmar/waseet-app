import assert from 'node:assert/strict';
import test from 'node:test';
import { birthDateFromParts, isValidBirthDate } from '../src/schemas/birth-date';
import { signUpSchema } from '../src/schemas/auth';
test('birth date rejects rollover dates and future dates, and accepts leap days', () => {
  const today = new Date(2026, 8, 18);
  assert.equal(birthDateFromParts(29, 2, 2000, today), '2000-02-29T00:00:00.000Z');
  for (const [day, month, year] of [
    [31, 2, 2000],
    [29, 2, 2001],
    [31, 4, 2000],
    [19, 9, 2026],
    [1, 1, 1899],
    [0, 1, 2000],
    [1, 13, 2000],
    [1.5, 1, 2000],
  ]) {
    assert.equal(birthDateFromParts(day, month, year, today), null);
  }
  assert.equal(birthDateFromParts(18, 9, 2026, today), '2026-09-18T00:00:00.000Z');
  assert.equal(isValidBirthDate(''), false);
  assert.equal(isValidBirthDate('2001-02-29'), false);
});
test('registration validates without an Olivery phone and requires explicit birthday and matching passwords', async () => {
  const values = {
    firstName: ' أحمد ',
    secondName: 'محمد',
    lastName: 'علي',
    email: ' test@example.com ',
    phoneNumber: '912345678',
    country: 'سوريا',
    address: 'دمشق',
    birthDate: '2000-02-29T00:00:00.000Z',
    password: 'test-password',
    confirmPassword: 'test-password',
  };
  const parsed = await signUpSchema.validate(values);
  assert.equal(parsed.firstName, 'أحمد');
  assert.equal(parsed.email, 'test@example.com');
  assert.equal('oliveryContactMobile' in parsed, false);
  await assert.rejects(signUpSchema.validate({ ...values, birthDate: '' }));
  await assert.rejects(signUpSchema.validate({ ...values, confirmPassword: 'mismatch' }));
  await assert.rejects(signUpSchema.validate({ ...values, phoneNumber: 'abc' }));
});
