import type { User } from '@/types/models';
import { normalizeRole } from './roles';
export function normalizeUser(raw: Record<string, any>, previous?: User | null): User {
  const role = normalizeRole(raw.role ?? previous?.role);
  if (!role) throw new Error('نوع الحساب غير معروف. تواصل مع الإدارة.');
  const token = raw.token ?? previous?.token;
  const userId = raw.userId ?? raw.id ?? raw.user_id ?? previous?.userId;
  if (!token || !userId) throw new Error('بيانات الجلسة غير مكتملة. سجل الدخول مجددًا.');
  // A profile refresh can remove a previously supplied reason; do not keep stale review copy.
  return { ...previous, ...raw, rejectionReason: raw.rejectionReason, userId, role, token };
}
