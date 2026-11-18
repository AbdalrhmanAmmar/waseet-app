import { isAccountRestricted } from '@/auth/permissions';
import type { User } from '@/types/models';
export function merchantAccess(user: User | null | undefined, ownerId: string) {
  return (
    !!user &&
    user.role === 'Merchant' &&
    !isAccountRestricted(user) &&
    String(user.userId) === ownerId
  );
}
