import { can, type Permission } from '@/auth/permissions';
import {
  canResolveOrderIssue,
  issueIsResolved,
  orderIssueEligibility,
  orderIssueResolutionSchema,
  orderIssueSchema,
  positiveIssueId,
  readOrderIssues,
} from '@/domain/order-issues';
import type { DeliveryMode } from '@/domain/order-workflow';
import type { RootState } from '@/store';
import type { Id, OrderIssue } from '@/types/models';
import { baseApi } from '../base-api';
import { orderDetails } from '../normalizers';

const reject = (message: string, status = 'ORDER_ISSUE_VALIDATION') => ({
  error: { status, message },
});

const hasIssuePermission = (api: { getState: () => unknown }, permission: Permission) => {
  const role = (api.getState() as RootState).AuthSlice.userData?.role;
  return can(role, permission);
};

export const orderIssuesApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === 'development',
  endpoints: (build) => ({
    orderIssues: build.query<OrderIssue[], Id>({
      async queryFn(orderId, api, _options, query) {
        if (!hasIssuePermission(api, 'orders.issues.read'))
          return reject('لا تملك صلاحية عرض مشكلات هذا الطلب.');
        const result = await query({ url: `orders/${encodeURIComponent(orderId)}/issues` });
        if (result.error) return { error: result.error };
        try {
          return { data: readOrderIssues(result.data) };
        } catch (error) {
          return reject(
            error instanceof Error ? error.message : 'تعذر قراءة مشكلات الطلب.',
            'INVALID_RESPONSE',
          );
        }
      },
      providesTags: (_result, _error, orderId) => [{ type: 'OrderIssues', id: orderId }],
    }),
    createOrderIssue: build.mutation<
      null,
      { orderId: Id; note: string; deliveryMode: DeliveryMode }
    >({
      async queryFn(args, api, _options, query) {
        if (!hasIssuePermission(api, 'orders.issues.create'))
          return reject('لا تملك صلاحية تسجيل مشكلة لهذا الطلب.');
        const parsed = orderIssueSchema.safeParse({ note: args.note });
        if (!parsed.success) return reject(parsed.error.issues[0].message);

        const latestResult = await query({
          url: `orders/${encodeURIComponent(args.orderId)}`,
        });
        if (latestResult.error) return { error: latestResult.error };
        try {
          const latest = orderDetails(latestResult.data, args.orderId);
          const stored = latest.deliveryMode?.trim().toLowerCase();
          if ((stored === 'internal' || stored === 'external') && stored !== args.deliveryMode)
            return reject('تغيّرت طريقة توصيل الطلب. راجع التفاصيل المحدثة قبل تسجيل المشكلة.');
          const mode = stored === 'internal' || stored === 'external' ? stored : args.deliveryMode;
          const eligibility = orderIssueEligibility(latest, mode);
          if (!eligibility.allowed)
            return reject(eligibility.reason ?? 'تسجيل المشكلة غير متاح للحالة الحالية.');
        } catch {
          return reject('تعذر قراءة أحدث تفاصيل الطلب. لم يتم تسجيل المشكلة.');
        }

        const result = await query({
          url: `orders/${encodeURIComponent(args.orderId)}/issues`,
          method: 'POST',
          data: parsed.data,
        });
        return result.error ? { error: result.error } : { data: null };
      },
      invalidatesTags: (_result, _error, args) => [
        { type: 'OrderIssues', id: args.orderId },
        'Orders',
      ],
    }),
    resolveOrderIssue: build.mutation<
      null,
      { orderId: Id; issueId: number; resolutionNote: string }
    >({
      async queryFn(args, api, _options, query) {
        if (!hasIssuePermission(api, 'orders.issues.resolve'))
          return reject('حل مشكلات الطلب متاح لموظف الإدارة فقط.');
        const parsed = orderIssueResolutionSchema.safeParse(args);
        if (!parsed.success) return reject(parsed.error.issues[0].message);

        const currentResult = await query({
          url: `orders/${encodeURIComponent(args.orderId)}/issues`,
        });
        if (currentResult.error) return { error: currentResult.error };
        let current: OrderIssue | undefined;
        try {
          current = readOrderIssues(currentResult.data).find(
            (issue) => positiveIssueId(issue.orderIssueId) === parsed.data.issueId,
          );
        } catch (error) {
          return reject(
            error instanceof Error ? error.message : 'تعذر التحقق من حالة المشكلة.',
            'INVALID_RESPONSE',
          );
        }
        if (!current) return reject('المشكلة لم تعد متاحة ضمن الطلب. حدّث القائمة.');
        if (!canResolveOrderIssue(current))
          return reject(
            issueIsResolved(current)
              ? 'المشكلة محلولة بالفعل.'
              : 'إجراء الحل غير متاح وفق أحدث حالة للمشكلة.',
          );

        const result = await query({
          url: `orders/issues/${parsed.data.issueId}/resolve`,
          method: 'POST',
          data: { resolutionNote: parsed.data.resolutionNote },
        });
        if (!result.error) return { data: null };

        const status = result.error.status;
        if (typeof status === 'number' && status < 500 && status !== 408)
          return { error: result.error };

        const verification = await query({
          url: `orders/${encodeURIComponent(args.orderId)}/issues`,
        });
        if (!verification.error) {
          try {
            const verified = readOrderIssues(verification.data).find(
              (issue) => positiveIssueId(issue.orderIssueId) === parsed.data.issueId,
            );
            if (verified && issueIsResolved(verified)) return { data: null };
          } catch {
            // The uncertain result below is safer than repeating a possibly successful write.
          }
        }
        return reject(
          'لم نتمكن من التأكد من نتيجة الحل. حدّث قائمة المشكلات وتحقق من حالتها قبل إعادة المحاولة.',
          'ORDER_ISSUE_UNCERTAIN',
        );
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'OrderIssues', id: args.orderId }],
    }),
  }),
});

export const { useOrderIssuesQuery, useCreateOrderIssueMutation, useResolveOrderIssueMutation } =
  orderIssuesApi;
