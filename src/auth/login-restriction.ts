export type LoginRestriction =
  'Pending' | 'Rejected' | 'Suspended' | 'Blocked' | 'Inactive' | 'Disabled';
/** Presentation only: a rejected login is never promoted to an authenticated session. */
export function loginRestriction(
  message: string,
  accountStatus?: unknown,
): LoginRestriction | null {
  const statuses: Record<string, LoginRestriction> = {
    pending: 'Pending',
    rejected: 'Rejected',
    suspended: 'Suspended',
    blocked: 'Blocked',
    inactive: 'Inactive',
    disabled: 'Disabled',
  };
  if (typeof accountStatus === 'string') {
    const explicit = statuses[accountStatus.trim().toLowerCase()];
    if (explicit) return explicit;
  }
  const value = message.trim().toLowerCase().replace(/\s+/g, ' ');
  if (
    /\b(?:your\s+)?account\s+(?:status\s+)?(?:is\s+)?(?:still\s+)?pending\b/.test(value) ||
    /\baccount\s+(?:is\s+)?(?:awaiting|waiting for)\s+(?:admin\s+)?approval\b/.test(value) ||
    /\baccount\s+(?:is|has)\s+not\s+(?:yet (?:been )?approved|(?:been )?approved yet)\b/.test(
      value,
    ) ||
    /لم تتم الموافقة على (?:حسابك|الحساب)\s+بعد/.test(value) ||
    /(?:حسابك|الحساب)\s+(?:لا يزال\s+)?(?:قيد المراجعة|بانتظار (?:الموافقة|التفعيل))/.test(value)
  )
    return 'Pending';
  if (
    /(?:لم تتم الموافقة على (?:حسابك|الحساب)|تم رفض (?:حسابك|الحساب|طلب (?:إنشاء|تفعيل) حسابك))/.test(
      value,
    ) ||
    /\baccount\s+(?:has\s+)?(?:not been|was not|is not)\s+approved\b/.test(value)
  )
    return 'Rejected';
  const english =
    /\b(?:your\s+)?account\s+(?:has been\s+|is\s+)?(rejected|suspended|blocked|inactive|disabled)\b/.exec(
      value,
    )?.[1];
  return english ? statuses[english] : null;
}
