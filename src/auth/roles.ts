export const ROLES = ['Merchant', 'SalesEmployee', 'ManagementEmployee', 'DeliveryAgent'] as const;
export type Role = (typeof ROLES)[number];
export const roleLabels: Record<Role, string> = {
  Merchant: 'تاجر',
  SalesEmployee: 'موظف مبيعات',
  ManagementEmployee: 'موظف إدارة',
  DeliveryAgent: 'مندوب توصيل',
};
export const rolePaths: Record<Role, string> = {
  Merchant: '/merchant',
  SalesEmployee: '/sales-employee',
  ManagementEmployee: '/management-employee',
  DeliveryAgent: '/delivery-agent',
};
export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  // The previous client used both Sales and SalesEmployee.
  if (key === 'sales') return 'SalesEmployee';
  return ROLES.find((role) => role.toLowerCase() === key) ?? null;
}
