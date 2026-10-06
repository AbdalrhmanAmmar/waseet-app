import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeErrors, employeeInput } from '../src/domain/merchant-employee';
test('employee payload omits confirmation and trims only profile fields', () => {
  const form = {
    firstName: ' أحمد ',
    lastName: ' علي ',
    email: ' employee@example.com ',
    password: ' pass word ',
    confirmPassword: ' pass word ',
  };
  assert.deepEqual(employeeErrors(form), {});
  assert.deepEqual(employeeInput(form), {
    firstName: 'أحمد',
    lastName: 'علي',
    email: 'employee@example.com',
    password: ' pass word ',
  });
  assert.ok(employeeErrors({ ...form, confirmPassword: 'different' }).confirmPassword);
  assert.ok(employeeErrors({ ...form, email: 'bad' }).email);
  assert.ok(employeeErrors({ ...form, firstName: ' ' }).firstName);
});
