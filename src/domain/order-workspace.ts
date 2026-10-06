import { terminalStatus as isOrderTerminal } from './order-workflow';
import type { Order } from '@/types/models';

export type OrderStatusDefinition = { status: string; isTerminal: boolean };
export { terminalStatus as isOrderTerminal } from './order-workflow';
const digits = (value: string) =>
  value
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776));
const normalize = (value: string) =>
  digits(value)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي');
export function filterOrders(
  orders: Order[],
  search: string,
  filter: string,
  definitions?: OrderStatusDefinition[],
) {
  const term = normalize(search);
  return orders.filter(
    (order) =>
      (filter === 'attention'
        ? !isOrderTerminal(order.status, definitions)
        : !filter || order.status === filter) &&
      normalize(
        `${order.orderId} ${order.customerName} ${order.customerMobile ?? ''} ${order.customerArea ?? ''}`,
      ).includes(term),
  );
}
export function orderPhone(value?: string) {
  if (typeof value !== 'string') return null;
  const phone = digits(value).replace(/[\s()\-]/g, '');
  return /^\+?\d{7,15}$/.test(phone) ? `tel:${phone}` : null;
}
export function orderMap(order: Pick<Order, 'customerAddress' | 'customerArea'>) {
  const address = [order.customerAddress, order.customerArea]
    .filter((v): v is string => typeof v === 'string' && !!v.trim())
    .map((v) => v.trim())
    .join('، ');
  if (!address) return null;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return url.length <= 2048 ? url : null;
}
