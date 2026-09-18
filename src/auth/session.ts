import type { User } from '@/types/models';
import { normalizeRole } from './roles';
export function normalizeUser(raw: Record<string, any>, previous?: User | null): User {
  const role = normalizeRole(raw.role ?? previous?.role);
  if (!role) throw new Error('نوع الحساب غير معروف. تواصل مع الإدارة.');
  const token = raw.token ?? previous?.token;
  const userId = raw.userId ?? raw.id ?? raw.user_id ?? previous?.userId;
  if (!token || !userId) throw new Error('بيانات الجلسة غير مكتملة. سجل الدخول مجددًا.');
  return { ...previous, ...raw, userId, role, token };
}
