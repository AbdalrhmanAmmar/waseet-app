import assert from 'node:assert/strict';
import test from 'node:test';
import { asciiDigits, countryFlag, registrationPhone } from '../src/domain/auth-inputs';
import { signUpSchema } from '../src/schemas/auth';
test('registration phone accepts Arabic digits and formatted international pastes without duplicating the selected prefix', () => {
  for (const value of ['٩٤٤ ١٢٣ ٤٥٦', '+٩٦٣ (٩٤٤) ١٢٣-٤٥٦', '00963 944123456', '۹۴۴۱۲۳۴۵۶'])
    assert.deepEqual(registrationPhone(value, '963'), {
      error: null,
      international: '+963944123456',
    });
  assert.equal(asciiDigits('١۲3'), '123');
  assert.equal(registrationPhone('0944123456', '963').international, '+9630944123456');
});
test('phone errors do not guess a country or discard meaningful digits and enforce the complete international length', () => {
  for (const value of [
    '+201012345678',
    '00201012345678',
    'abc',
    '*123#',
    '123',
    '',
    '1234567890123',
  ])
    assert.ok(registrationPhone(value, '963').error);
  assert.ok(registrationPhone('944123456', '').error);
  assert.equal(registrationPhone('+201012345678', '20').international, '+201012345678');
  assert.equal(registrationPhone('+963123456789012', '963').error, null);
});
test('phone schema validates against the selected calling code, while retaining the existing signup contract', async () => {
  const base = {
    firstName: 'أحمد',
    secondName: 'محمد',
    lastName: 'علي',
    email: 'test@example.com',
    phoneNumber: '+20 1012345678',
    country: 'ألمانيا',
    address: 'عنوان تجريبي',
    password: 'test-password',
    confirmPassword: 'test-password',
  };
  const parsed = await signUpSchema.validate(base, { context: { callingCode: '20' } });
  assert.equal(parsed.country, 'ألمانيا');
  await assert.rejects(
    signUpSchema.validate(base, { context: { callingCode: '963' } }),
    /كود الرقم مختلف/,
  );
  await assert.rejects(
    signUpSchema.validate({ ...base, secondName: '' }, { context: { callingCode: '20' } }),
  );
  assert.equal(countryFlag('SY'), '🇸🇾');
  assert.equal(countryFlag('bad'), '');
});
