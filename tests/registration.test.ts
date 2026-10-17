import assert from 'node:assert/strict';
import test from 'node:test';
import { signUpSchema } from '../src/schemas/auth';
test('registration validates without birth date or an Olivery phone and requires matching passwords', async () => {
  const values = {
    firstName: ' أحمد ',
    secondName: 'محمد',
    lastName: 'علي',
    email: ' test@example.com ',
    phoneNumber: '912345678',
    country: 'سوريا',
    address: 'دمشق',
    password: 'test-password',
    confirmPassword: 'test-password',
  };
  const parsed = await signUpSchema.validate(values);
  assert.equal(parsed.firstName, 'أحمد');
  assert.equal(parsed.email, 'test@example.com');
  assert.equal('birthDate' in parsed, false);
  assert.equal('oliveryContactMobile' in parsed, false);
  await assert.rejects(signUpSchema.validate({ ...values, confirmPassword: 'mismatch' }));
  await assert.rejects(signUpSchema.validate({ ...values, phoneNumber: 'abc' }));
});
