import type { Role } from './roles';
export type Permission = 'catalog.read' | 'orders.create' | 'orders.status' | 'profit.read';
const permissions: Record<Role, readonly Permission[]> = {
  Merchant: ['catalog.read', 'orders.create', 'profit.read'],
  SalesEmployee: ['catalog.read', 'orders.create'],
  ManagementEmployee: ['orders.status'],
  DeliveryAgent: ['orders.status'],
};
export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && permissions[role].includes(permission);
}
export function isAccountRestricted(
  user: { accountStatus?: string; status?: string } | null,
): boolean {
  const status = (user?.accountStatus ?? user?.status ?? '').toLowerCase();
  return ['pending', 'rejected', 'suspended', 'blocked', 'inactive', 'disabled'].includes(status);
}
