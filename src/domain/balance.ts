import type { User } from '@/types/models';
export function balanceNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function balanceUpdate(raw: Record<string, unknown>, previous?: User | null) {
  const amount = balanceNumber(raw.dollarBalance);
  if (amount !== null)
    return { dollarBalance: amount, balanceUpdatedAt: Date.now(), balanceStale: false };
  return {
    dollarBalance: balanceNumber(previous?.dollarBalance),
    balanceUpdatedAt: previous?.balanceUpdatedAt,
    balanceStale: true,
  };
}
export const formatBalance = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Login can supply account data inside user, with balance alongside it.
export function loginUser(body: Record<string, any>) {
  const user = body.user ?? body;
  return {
    ...user,
    ...(user.dollarBalance === undefined && body.dollarBalance !== undefined
      ? { dollarBalance: body.dollarBalance }
      : {}),
    token: body.token ?? user.token,
  };
}
