import test from 'node:test';
import assert from 'node:assert/strict';
import { internalTargets, canEditInternal } from '../src/domain/internal-order-policy';
import {
  externalTargets,
  externalReturnReason,
  canEditExternal,
} from '../src/domain/external-order-policy';
import { orderEditDecision } from '../src/domain/order-edit-policy';
import { internalReturnDecision } from '../src/domain/internal-return';
import type { Order } from '../src/types/models';
test('assignment metadata never changes role-based order actions or edit and return eligibility', () => {
  for (const role of [
    'Merchant',
    'MerchantEmployee',
    'SalesEmployee',
    'DeliveryAgent',
    'ManagementEmployee',
  ])
    for (const orderType of ['Normal', 'Return'])
      for (const status of [
        'Processing',
        'Confirmed',
        'Stuck',
        'Out for Delivery',
        'Delivered',
        'Printed Confirmed',
        'returned_in_progress',
        'returned_delivered',
        'completed_returned',
      ]) {
        const actor = { role, userId: 7, ownerMerchantId: 7 };
        const order: Order = {
          orderId: 21,
          orderType,
          status,
          userId: 7,
          assignedToEmployeeId: 7,
          assignedToDeliveryAgentId: 7,
          customerName: 'عميل',
          oliveryOrderId: null,
          oliveryStatus: 'delivered_with_return',
          orderTotalUSD: 10,
          items: [{ orderItemId: 1, productCode: 1, quantity: 1 }],
        };
        const decisions = (value: Order) => [
          internalTargets(value, actor, 'internal'),
          externalTargets(value, actor, 'external'),
          canEditInternal(value, actor, 'internal'),
          canEditExternal(value, actor, 'external'),
          orderEditDecision(value, actor, 'internal'),
          orderEditDecision(value, actor, 'external'),
          internalReturnDecision(value, 'internal', actor),
          externalReturnReason(value, actor, 'external'),
        ];
        for (const assignment of [undefined, null, 0, 99, '99'])
          assert.deepEqual(
            decisions({
              ...order,
              assignedToEmployeeId: assignment,
              assignedToDeliveryAgentId: assignment,
            }),
            decisions(order),
            `${role} ${orderType} ${status} ${assignment}`,
          );
      }
});
