import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deliveryMap,
  deliveryPhone,
  filterDeliveries,
  isDeliveryTerminal,
} from '../src/domain/delivery-orders';
import type { Order } from '../src/types/models';

test('delivery actions encode only the address and accept phone numbers without executable dial codes', () => {
  assert.equal(deliveryPhone('+٩٦٣ (٩٤٤) ١٢٣-٤٥٦'), 'tel:+963944123456');
  for (const value of ['', '*123#', 'javascript:alert(1)', '123', undefined])
    assert.equal(deliveryPhone(value), null);
  const url = new URL(deliveryMap({ customerAddress: 'شارع النصر & ١٢', customerArea: 'دمشق' })!);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('query'), 'شارع النصر & ١٢، دمشق');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(deliveryMap({}), null);
  assert.equal(deliveryMap({ customerAddress: 'ش'.repeat(500) }), null);
});
test('delivery filters search Arabic names and digits, and server terminal metadata takes precedence', () => {
  const orders = [
    { orderId: 21, status: 'Processing', customerName: 'أحمد', customerMobile: '0991234567' },
    { orderId: 22, status: 'Delivered', customerName: 'سارة' },
    { orderId: 23, status: 'Archived', customerName: 'محمود' },
  ] as Order[];
  const definitions = [
    { status: 'Archived', isTerminal: true },
    { status: 'Delivered', isTerminal: true },
  ];
  assert.deepEqual(
    filterDeliveries(orders, '', 'attention', definitions).map((o) => o.orderId),
    [21],
  );
  assert.deepEqual(
    filterDeliveries(orders, 'احمد', '', definitions).map((o) => o.orderId),
    [21],
  );
  assert.equal(filterDeliveries(orders, '٢٢', 'Delivered').length, 1);
  assert.equal(filterDeliveries(orders, '٠٩٩١٢٣٤٥٦٧', '').length, 1);
  assert.equal(
    isDeliveryTerminal('Delivered', [{ status: 'Delivered', isTerminal: false }]),
    false,
  );
  assert.equal(orders.length, 3);
});
