import assert from 'node:assert/strict';
import test from 'node:test';
import {
  internalReturnDecision,
  createReturnDraft,
  validateReturnDraft,
  returnItemsTotal,
  returnSourceSnapshot,
  returnSettlementSnapshot,
  createdInternalReturnId,
} from '../src/domain/internal-return';
import { guardedStatusChange } from '../src/api/shared/order-guards';
import { order } from '../src/api/normalizers';
import type { Order } from '../src/types/models';
const actor = { role: 'ManagementEmployee', userId: 7 };
const original: Order = {
  orderId: 21,
  orderType: 'Normal',
  status: 'Delivered',
  oliveryOrderId: null,
  deliveryMode: 'internal',
  assignedToEmployeeId: 7,
  customerName: 'عميل',
  customerArea: 'دمشق',
  orderTotalUSD: 210.2,
  items: [
    {
      orderItemId: 51,
      productCode: 11,
      productName: 'منتج',
      quantity: 2,
      color: 'أسود',
      actualSellPriceUSD: 105.1,
    },
  ],
};
test('missing or null processed flag allows creation; positive prior-return evidence blocks it', () => {
  for (const flag of [undefined, null, false])
    assert.equal(
      internalReturnDecision({ ...original, isReturnProcessed: flag }, 'internal', actor).allowed,
      true,
    );
  assert.equal(
    internalReturnDecision({ ...original, isReturnProcessed: true }, 'internal', actor).allowed,
    false,
  );
  assert.equal(
    internalReturnDecision(
      { ...original, items: [{ ...original.items[0], returnedQuantity: 1 }] },
      'internal',
      actor,
    ).allowed,
    false,
  );
});
test('only active management can create on delivered normal internal originals', () => {
  for (const role of ['Merchant', 'MerchantEmployee', 'SalesEmployee', 'DeliveryAgent'])
    assert.equal(internalReturnDecision(original, 'internal', { ...actor, role }).allowed, false);
  assert.equal(internalReturnDecision(original, 'internal', { ...actor, userId: 8 }).allowed, true);
  assert.equal(
    internalReturnDecision(original, 'internal', { ...actor, accountStatus: 'Suspended' }).allowed,
    false,
  );
  for (const patch of [
    { status: 'Completed' },
    { status: 'Processing' },
    { orderType: 'Return' },
    { oliveryOrderId: 88 },
  ])
    assert.equal(
      internalReturnDecision({ ...original, ...patch }, 'internal', actor).allowed,
      false,
    );
  assert.equal(internalReturnDecision(original, 'external', actor).allowed, false);
});
test('draft validates original line identifiers, quantity, explicit prices and color', () => {
  const draft = createReturnDraft(original);
  assert.equal(validateReturnDraft(original, draft).valid, false);
  draft[51].selected = true;
  assert.equal(validateReturnDraft(original, draft).valid, false);
  draft[51].price = '0';
  assert.deepEqual(validateReturnDraft(original, draft).body, {
    items: [{ orderItemId: 51, quantity: 2, returnPriceUSD: 0, color: 'أسود' }],
  });
  assert.equal(validateReturnDraft(original, draft).valid, true);
  draft[51].price = '123.4567';
  assert.equal(validateReturnDraft(original, draft).valid, true);
  for (const quantity of ['0', '3', '1.5', '', '2147483648']) {
    draft[51].quantity = quantity;
    assert.equal(validateReturnDraft(original, draft).valid, false);
  }
  draft[51].quantity = '1';
  draft[51].color = ' ';
  assert.equal(validateReturnDraft(original, draft).valid, false);
  draft[51].color = 'أبيض';
  draft[51].price = '-1';
  assert.equal(validateReturnDraft(original, draft).valid, false);
  const duplicate = {
    ...original,
    items: [original.items[0], { ...original.items[0], orderItemId: '51' }],
  };
  assert.equal(internalReturnDecision(duplicate, 'internal', actor).allowed, false);
  assert.equal(validateReturnDraft(duplicate, draft).valid, false);
});
test('preview decimal totals do not alter submitted unit prices', () => {
  assert.equal(returnItemsTotal([{ quantity: 3, returnPriceUSD: 105.1 }]), 315.3);
  assert.equal(returnItemsTotal([{ quantity: 2, returnPriceUSD: 1e-7 }]), 2e-7);
  assert.equal(returnItemsTotal([{ quantity: 2, returnPriceUSD: Infinity }]), NaN);
});
test('return links require a distinct new id, Return type and original relationship', () => {
  assert.equal(
    createdInternalReturnId({ orderId: 22, orderType: 'Return', originalOrderId: 21 }, 21),
    22,
  );
  for (const row of [
    { orderId: 22 },
    { orderId: 21, orderType: 'Return', originalOrderId: 21 },
    { orderId: 22, orderType: 'Normal', originalOrderId: 21 },
    { orderId: 22, orderType: 'Return', originalOrderId: 44 },
  ])
    assert.equal(createdInternalReturnId(row, 21), null);
  assert.equal(
    order({ ...original, original_order_id: 9, is_return_finalized: true }).originalOrderId,
    9,
  );
  assert.equal(order({ ...original, is_return_finalized: true }).isReturnFinalized, true);
});
test('preflight compares reviewed financial settlement before irreversible completion', async () => {
  const current = order({
    ...original,
    orderId: 881,
    orderType: 'Return',
    status: 'returned_delivered',
    totalAdminProfitUSD: 4,
    totalMerchantProfitUSD: -2,
  });
  let writes = 0;
  const query = async (args: { url?: string; method?: string; data?: unknown }) => {
    if (args.method === 'POST') {
      writes++;
      current.status = 'completed_returned';
    }
    return { data: args.url === 'delivery-areas' ? [] : { data: current } };
  };
  const request = {
    orderId: 881,
    status: 'completed_returned',
    expectedStatus: 'returned_delivered',
  };
  assert.ok((await guardedStatusChange(request, query, actor)).error);
  assert.equal(writes, 0);
  const snapshot = returnSettlementSnapshot(current);
  current.totalAdminProfitUSD = 5;
  assert.ok(
    (await guardedStatusChange({ ...request, expectedReturnSettlement: snapshot }, query, actor))
      .error,
  );
  assert.equal(writes, 0);
  assert.ok(
    !(
      await guardedStatusChange(
        { ...request, expectedReturnSettlement: returnSettlementSnapshot(current) },
        query,
        actor,
      )
    ).error,
  );
  assert.equal(writes, 1);
  assert.notEqual(
    returnSourceSnapshot(original),
    returnSourceSnapshot({ ...original, items: [{ ...original.items[0], quantity: 1 }] }),
  );
});

test('management creation does not require assignment metadata or matching employee', () => {
  for (const assignedToEmployeeId of [undefined, null, 0, '', 99, '7']) {
    assert.equal(
      internalReturnDecision({ ...original, assignedToEmployeeId }, 'internal', actor).allowed,
      true,
    );
  }
});
test('missing delivery reference and order type do not misleadingly report assignment errors', () => {
  assert.match(
    internalReturnDecision({ ...original, oliveryOrderId: undefined }, 'internal', actor).reason,
    /ربط الطلب بشركة التوصيل غير متوفرة/,
  );
  assert.match(
    internalReturnDecision({ ...original, orderType: undefined }, 'internal', actor).reason,
    /نوع Normal/,
  );
  assert.match(internalReturnDecision(original, 'unknown', actor).reason, /تعذر تحديد نوع توصيل/);
});
