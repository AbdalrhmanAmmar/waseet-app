import type { Permission } from '@/auth/permissions';
import { can, isAccountRestricted } from '@/auth/permissions';
import { useAppSelector } from './use-store';
export function useSession() {
  const state = useAppSelector((s) => s.AuthSlice);
  return {
    ...state,
    role: state.userData?.role ?? null,
    restricted: isAccountRestricted(state.userData),
    can: (permission: Permission) => can(state.userData?.role, permission),
  };
}
