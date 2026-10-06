import test from 'node:test';
import assert from 'node:assert/strict';
import { primaryPhoneError, primaryPhonePayload } from '../src/domain/order-phone';
import { validateOrder, emptyOrder, orderPayload } from '../src/domain/order-draft';
import { order } from '../src/api/normalizers';
test('phone rules distinguish internal, external and unresolved delivery without destroying input', () => {
  assert.equal(primaryPhoneError('+20 (100) 123-4567', 'internal'), null);
  assert.ok(primaryPhoneError(' ', 'internal'));
  assert.ok(primaryPhoneError('+20 (100) 123-4567', 'external'));
  assert.equal(primaryPhoneError('٠٩١٢٣٤٥٦٧٨', 'external'), null);
  assert.ok(primaryPhoneError('09123456789', 'external'));
  assert.ok(primaryPhoneError('0912345678', 'unknown'));
  assert.equal(primaryPhonePayload('+20 (100) 123-4567', 'internal'), '+20 (100) 123-4567');
  assert.equal(primaryPhonePayload('٠٩١٢٣٤٥٦٧٨', 'external'), '0912345678');
});
test('additional phone accepts arbitrary long text, survives normalization and is omitted when empty', () => {
  const draft = {
    ...emptyOrder(),
    customerArea: 'دمشق',
    customerMobile: '+20 123',
    secondCustomerPhone: 'x'.repeat(600),
  };
  assert.equal(orderPayload(draft, 'internal').secondCustomerPhone, draft.secondCustomerPhone);
  assert.equal(
    validateOrder(draft, [{ deliveryAreaId: 1, city: 'دمشق', fee: 0, isInternalDelivery: true }])
      .customerMobile,
    undefined,
  );
  assert.equal(order({ second_customer_phone: '+20 123' }).secondCustomerPhone, '+20 123');
  assert.equal(orderPayload({ ...draft, secondCustomerPhone: ' ' }).secondCustomerPhone, undefined);
});
