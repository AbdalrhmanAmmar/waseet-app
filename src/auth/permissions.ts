import type { Role } from './roles';
export type Permission =
  | 'catalog.read'
  | 'orders.create'
  | 'orders.status'
  | 'orders.edit'
  | 'orders.issues.read'
  | 'orders.issues.create'
  | 'orders.issues.resolve'
  | 'profit.read';
const permissions: Record<Role, readonly Permission[]> = {
  MerchantEmployee: [
    'catalog.read',
    'orders.create',
    'orders.status',
    'orders.issues.read',
    'orders.issues.create',
    'profit.read',
  ],
  Merchant: [
    'catalog.read',
    'orders.create',
    'orders.status',
    'orders.issues.read',
    'orders.issues.create',
    'profit.read',
  ],
  SalesEmployee: [
    'catalog.read',
    'orders.create',
    'orders.status',
    'orders.issues.read',
    'orders.issues.create',
  ],
  ManagementEmployee: [
    'orders.status',
    'orders.edit',
    'orders.issues.read',
    'orders.issues.create',
    'orders.issues.resolve',
  ],
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
