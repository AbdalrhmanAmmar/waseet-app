import {
  INTERNAL_DELIVERY_STATUSES,
  localOrderStatusLabel,
} from '@/domain/order-status-presentation';
export const orderStatuses = Object.entries(INTERNAL_DELIVERY_STATUSES).map(([value, item]) => ({
  value,
  label: item.label,
}));
export const statusLabel = localOrderStatusLabel;
