import test from 'node:test';
import assert from 'node:assert/strict';
import { orderStatusPresentation as label } from '../src/domain/order-status-presentation';
import { filterByDelivery, resolveDeliveryMode } from '../src/domain/order-delivery-list';
import type { Order } from '../src/types/models';
const internal: Order = {
  orderId: 1,
  customerName: 'أحمد',
  status: 'Ready for Dispatch',
  deliveryMode: 'internal',
  items: [],
  orderTotalUSD: 10,
};
const external: Order = {
  ...internal,
  orderId: 2,
  deliveryMode: 'external',
  status: 'Printed Confirmed',
  oliveryStatus: 'ready_for_dispatch',
  deliveryStatus: 'Delivered',
};
test('status labels distinguish internal and provider codes and contextual returns', () => {
  assert.equal(label('Ready for Dispatch', 'internal').label, 'جاهز للتوصيل');
  assert.equal(label('ready_for_dispatch', 'external').label, 'جاهز للتوزيع');
  assert.equal(label('returned_delivered', 'internal').label, 'تم تسليم المرجع');
  assert.equal(label('returned_delivered', 'external').label, 'تم تسليم الإرجاع');
  assert.equal(label('completed_returned', 'external').label, 'تم إتمام الإرجاع');
  assert.equal(label('future', 'external').label, 'future');
  assert.equal(label('printing_waiting', 'external').label, 'بانتظار الطباعة');
});
test('stored mode wins, unknown remains unknown and raw provider status drives filtering', () => {
  assert.equal(resolveDeliveryMode(external, []), 'external');
  assert.equal(resolveDeliveryMode({ ...internal, deliveryMode: null }, []), 'unknown');
  assert.deepEqual(filterByDelivery([internal, external], [], 'external', ['ready_for_dispatch']), [
    external,
  ]);
  assert.deepEqual(filterByDelivery([external], [], 'external', ['delivered']), []);
  assert.deepEqual(
    filterByDelivery([external], [], 'external', ['ready_for_dispatch'], ['Confirmed']),
    [],
  );
  assert.deepEqual(filterByDelivery([external], [], 'external', [], ['Printed Confirmed']), [
    external,
  ]);
});
