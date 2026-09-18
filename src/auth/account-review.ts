import { loginRestriction, type LoginRestriction } from './login-restriction';

/** Optional, user-facing metadata only. Never use it to establish a session. */
export interface AccountReview {
  accountStatus?: LoginRestriction;
  firstName?: string;
  userId?: string;
  rejectionReason?: string;
}
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export function accountReview(value: unknown): AccountReview {
  const root = record(value);
  const body = record(root.data ?? value);
  const user = record(body.user ?? body);
  const status = user.accountStatus ?? body.accountStatus ?? root.accountStatus;
  const id = user.userId;
  return {
    accountStatus: loginRestriction('', status) ?? undefined,
    firstName: text(user.firstName),
    userId: typeof id === 'number' && Number.isFinite(id) ? String(id) : text(id),
    // Do not treat a generic message, admin note, or internal error as a rejection reason.
    rejectionReason: text(user.rejectionReason ?? body.rejectionReason ?? root.rejectionReason),
  };
}
