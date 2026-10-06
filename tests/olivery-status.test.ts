import test from 'node:test';
import assert from 'node:assert/strict';
import { OLIVERY_TITLES } from '../src/domain/olivery-status';
import { orderStatusPresentation } from '../src/domain/order-status-presentation';
import {
  shipmentCode,
  canEditExternal,
  externalReturnReason,
  externalTargets,
} from '../src/domain/external-order-policy';
import { orderDetails } from '../src/api/normalizers';
import { filterByDelivery } from '../src/domain/order-delivery-list';
const actor = { role: 'ManagementEmployee', userId: 7 };
const order = orderDetails(
  {
    orderId: 1,
    status: 'Printed Confirmed',
    orderType: 'Normal',
    oliveryOrderId: 55,
    items: [{ orderItemId: 1, quantity: 2 }],
  },
  1,
);
test('all provider titles share display, filter and eligibility identity with their codes', () => {
  for (const [code, title] of Object.entries(OLIVERY_TITLES)) {
    assert.equal(shipmentCode(title), code);
    assert.deepEqual(
      orderStatusPresentation(title, 'external'),
      orderStatusPresentation(code, 'external'),
    );
    const current = { ...order, oliveryStatus: title, deliveryStatus: null };
    assert.equal(filterByDelivery([current], [], 'external', [code]).length, 1);
    assert.equal(current.status, 'Printed Confirmed');
    assert.equal(current.deliveryStatus, null);
  }
});
test('Arabic edit and return eligibility preserve the distinct printing states', () => {
  for (const status of ['waiting', 'بالانتظار', 'printing_waiting', 'بانتظار الطباعة'])
    assert.equal(canEditExternal({ ...order, oliveryStatus: status }, actor, 'external'), true);
  for (const status of ['waiting_printed', 'بالانتظار مطبوع', 'future_state'])
    assert.equal(canEditExternal({ ...order, oliveryStatus: status }, actor, 'external'), false);
  assert.equal(
    externalReturnReason({ ...order, oliveryStatus: 'تم التسليم ويوجد مرتجع' }, actor, 'external'),
    null,
  );
});
test('unknown provider states remain neutral and never become manual delivery transitions', () => {
  assert.deepEqual(orderStatusPresentation('future_state', 'external'), {
    label: 'future_state',
    tone: 'neutral',
  });
  for (const role of [
    'Merchant',
    'MerchantEmployee',
    'SalesEmployee',
    'DeliveryAgent',
    'ManagementEmployee',
  ]) {
    const targets = externalTargets(order, { ...actor, role }, 'external');
    for (const code of Object.keys(OLIVERY_TITLES)) assert.ok(!targets.includes(code));
  }
});
test('normalization preserves explicit financial guards without inferring them from paid or delivered', () => {
  const raw = { ...order, oliveryStatus: 'paid', IsRestocked: true, IsFeeDebited: false };
  assert.equal(orderDetails(raw, 1).isRestocked, true);
  assert.equal(orderDetails(raw, 1).isFeeDebited, false);
  assert.equal(orderDetails(raw, 1).isCredited, undefined);
  assert.equal(orderDetails({ ...order, oliveryStatus: 'delivered' }, 1).isCredited, undefined);
});
