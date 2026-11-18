import type { User } from '@/types/models';
const withdrawnKeys = [
  'totalPaidUSD',
  'TotalPaidUSD',
  'withdrawnAmount',
  'totalWithdrawnAmount',
  'amountWithdrawn',
  'WithdrawnAmount',
  'TotalWithdrawnAmount',
  'AmountWithdrawn',
] as const;
export function withdrawnUpdate(raw: Record<string, unknown>) {
  const key = withdrawnKeys.find((name) => Object.hasOwn(raw, name));
  const amount = key ? balanceNumber(raw[key]) : null;
  const value = amount !== null && amount >= 0 ? amount : null;
  return {
    withdrawnAmount: value,
    withdrawnUpdatedAt: value === null ? undefined : Date.now(),
    withdrawnStale: value === null,
  };
}
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
    ...Object.fromEntries(
      withdrawnKeys
        .filter((key) => user[key] === undefined && body[key] !== undefined)
        .map((key) => [key, body[key]]),
    ),
    ...(user.dollarBalance === undefined && body.dollarBalance !== undefined
      ? { dollarBalance: body.dollarBalance }
      : {}),
    token: body.token ?? user.token,
  };
}
