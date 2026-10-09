import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canResolveOrderIssue,
  issueActorLabel,
  issueStatusPresentation,
  orderIssueEligibility,
  orderIssueResolutionSchema,
  orderIssueSchema,
  readOrderIssues,
} from '../src/domain/order-issues';
import type { Order } from '../src/types/models';

const order = {
  orderId: 21,
  customerName: 'عميل',
  status: 'Completed',
  deliveryStatus: 'Delivered',
  oliveryStatus: null,
  orderTotalUSD: 10,
  items: [],
} satisfies Order;

test('order issues normalize dashboard fields and sort newest first', () => {
  const issues = readOrderIssues({
    data: [
      {
        order_issue_id: 3,
        note: ' أقدم ',
        created_at: '2026-09-01T00:00:00Z',
        created_by_role: 'Merchant',
        created_by_id: 7,
        status: 'Open',
      },
      {
        orderIssueId: 4,
        note: 'الأحدث',
        createdAt: '2026-10-01T00:00:00Z',
        status: 'Resolved',
        resolutionNote: 'تم التواصل',
      },
    ],
  });
  assert.deepEqual(
    issues.map((issue) => issue.orderIssueId),
    [4, 3],
  );
  assert.equal(issues[1].note, 'أقدم');
  assert.equal(issueActorLabel(issues[1]), 'التاجر #7');
  assert.equal(issueStatusPresentation(issues[0].status).label, 'تم الحل');
});

test('issue creation follows the delivered tracking source used by the dashboard', () => {
  assert.equal(orderIssueEligibility(order, 'internal').allowed, true);
  assert.equal(
    orderIssueEligibility(
      { ...order, deliveryStatus: 'In Progress', oliveryStatus: 'delivered' },
      'internal',
    ).allowed,
    false,
  );
  assert.equal(
    orderIssueEligibility(
      { ...order, deliveryStatus: 'Assigned', oliveryStatus: ' delivered ' },
      'external',
    ).allowed,
    true,
  );
  assert.equal(orderIssueEligibility(order, 'unknown').allowed, false);
});

test('issue Zod schemas and server resolve permission match the dashboard', () => {
  assert.equal(orderIssueSchema.safeParse({ note: 'مشكلة' }).success, true);
  assert.equal(orderIssueSchema.safeParse({ note: 'أ' }).success, false);
  assert.equal(
    orderIssueResolutionSchema.safeParse({ issueId: 2, resolutionNote: 'تم التواصل' }).success,
    true,
  );
  const issue = readOrderIssues({
    data: [{ orderIssueId: 2, note: 'وصف المشكلة', status: 'Open' }],
  })[0];
  assert.equal(canResolveOrderIssue(issue), true);
  assert.equal(canResolveOrderIssue({ ...issue, canResolve: false }), false);
  assert.equal(canResolveOrderIssue({ ...issue, status: 'Closed' }), false);
});
