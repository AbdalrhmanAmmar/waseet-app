import type { DeliveryMode as OrderDeliveryMode } from './order-workflow';
import type { Order as IOrder } from '@/types/models';
// Presentation matching never changes API values or workflow transition rules.
const normalizeStatus = (value: string) =>
  value
    .trim()
    .replace(/[\s_-]+/g, '')
    .toLowerCase();

export type OrderTone = 'neutral' | 'success' | 'warning' | 'info' | 'danger';
type StatusPresentation = { label: string; tone: OrderTone };

export const INTERNAL_DELIVERY_STATUSES: Record<string, StatusPresentation> = {
  Processing: { label: 'قيد المعالجة', tone: 'warning' },
  Confirmed: { label: 'مؤكد', tone: 'warning' },
  'Ready for Dispatch': { label: 'جاهز للتوصيل', tone: 'info' },
  'Out for Delivery': { label: 'خرج الى التوصيل', tone: 'info' },
  Delivered: { label: 'تم التسليم', tone: 'success' },
  'Refused on Delivery': { label: 'مرفوض عند التسليم', tone: 'danger' },
  Postponed: { label: 'مؤجل', tone: 'warning' },
  Stuck: { label: 'عالق', tone: 'warning' },
  Cancelled: { label: 'ملغي', tone: 'danger' },
  Completed: { label: 'مكتمل', tone: 'success' },
  Completed_return: { label: 'مكتمل راجع', tone: 'success' },
  'Printed Confirmed': { label: 'مطبوع مؤكد', tone: 'info' },
  returned_in_progress: { label: 'جاري تسليم المرجع', tone: 'info' },
  returned_delivered: { label: 'تم تسليم المرجع', tone: 'success' },
  completed_returned: { label: 'تم إتمام الإرجاع', tone: 'success' },
};

export const EXTERNAL_DELIVERY_STATUSES: Record<string, StatusPresentation> = {
  printing_waiting: { label: 'بانتظار الطباعة', tone: 'warning' },
  waiting_printed: { label: 'بالانتظار مطبوع', tone: 'warning' },
  waiting: { label: 'بالانتظار', tone: 'warning' },
  picking_up: { label: 'جاري الاستلام', tone: 'info' },
  picked_up: { label: 'تم الاستلام', tone: 'info' },
  in_branch: { label: 'بالشركة', tone: 'info' },
  ready_for_dispatch: { label: 'جاهز للتوزيع', tone: 'info' },
  to_branch: { label: 'متجه إلى الفرع', tone: 'info' },
  in_progress: { label: 'قيد التوصيل', tone: 'info' },
  delivered: { label: 'تم التسليم', tone: 'success' },
  rejected: { label: 'تم الرفض', tone: 'danger' },
  reschedule: { label: 'إعادة جدولة', tone: 'warning' },
  stuck: { label: 'عالق', tone: 'warning' },
  replacement: { label: 'استبدال', tone: 'warning' },
  confirm_branch: { label: 'تم التأكيد من الفرع', tone: 'info' },
  money_received: { label: 'تم استلام المبلغ', tone: 'info' },
  money_in: { label: 'المبلغ داخل (وارد)', tone: 'info' },
  money_out: { label: 'المبلغ خارج (صادر)', tone: 'info' },
  paid: { label: 'تم الدفع', tone: 'success' },
  completed: { label: 'مكتمل', tone: 'success' },
  branch_returned: { label: 'تم الإرجاع إلى الفرع', tone: 'warning' },
  ready_for_return: { label: 'مرجع معالج', tone: 'warning' },
  returned_in_progress: { label: 'الإرجاع قيد التنفيذ', tone: 'info' },
  returned_delivered: { label: 'تم تسليم الإرجاع', tone: 'success' },
  completed_returned: { label: 'تم إتمام الإرجاع', tone: 'success' },
  canceled: { label: 'ملغى', tone: 'danger' },
  deleted: { label: 'محذوف', tone: 'danger' },
  delivered_with_return: { label: 'تم التسليم مع إرجاع جزئي', tone: 'warning' },
};
const catalogs = { internal: INTERNAL_DELIVERY_STATUSES, external: EXTERNAL_DELIVERY_STATUSES };
const normalizedCatalogs = Object.fromEntries(
  Object.entries(catalogs).map(([mode, catalog]) => [
    mode,
    Object.fromEntries(
      Object.entries(catalog).map(([key, value]) => [normalizeStatus(key), value]),
    ),
  ]),
) as Record<'internal' | 'external', Record<string, StatusPresentation>>;
const legacy: Record<string, StatusPresentation> = {
  pending: { label: 'قيد المراجعة', tone: 'warning' },
  closed: { label: 'مغلق (قديم)', tone: 'neutral' },
};

const lookup = (catalog: Record<string, StatusPresentation>, key: string) =>
  Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : undefined;

// The mode identifies the source being presented: local/internal or provider/external.
// Exact codes take precedence: Ready for Dispatch and ready_for_dispatch are distinct.
export function orderStatusPresentation(
  value: string | null | undefined,
  mode: OrderDeliveryMode = 'unknown',
): StatusPresentation {
  const text = value?.trim() || 'غير محدد';
  const key = normalizeStatus(text);
  const exactInternal = lookup(INTERNAL_DELIVERY_STATUSES, text);
  const exactExternal = lookup(EXTERNAL_DELIVERY_STATUSES, text);
  if (exactInternal && exactExternal && exactInternal.label !== exactExternal.label) {
    if (mode === 'internal') return exactInternal;
    if (mode === 'external') return exactExternal;
    return { label: text + ' (مصدر الحالة غير محدد)', tone: 'neutral' };
  }
  if (exactInternal || exactExternal) return exactInternal ?? exactExternal!;
  const oldInternalLabels: Record<string, string> = {
    'المرتجع قيد النقل': 'returned_in_progress',
    'تم استلام المرتجع': 'returned_delivered',
    'مكتمل ومسوى': 'completed_returned',
    'قيد التنفيذ': 'Processing',
    'خرج للتوصيل': 'Out for Delivery',
  };
  if (mode === 'internal' && Object.prototype.hasOwnProperty.call(oldInternalLabels, text))
    return INTERNAL_DELIVERY_STATUSES[oldInternalLabels[text]];
  if (mode === 'internal' || mode === 'external') {
    const other = mode === 'internal' ? 'external' : 'internal';
    return (
      lookup(normalizedCatalogs[mode], key) ??
      lookup(normalizedCatalogs[other], key) ??
      lookup(legacy, key) ??
      Object.values(catalogs[mode]).find((status) => status.label === text) ?? {
        label: text,
        tone: 'neutral',
      }
    );
  }
  const internal = lookup(normalizedCatalogs.internal, key),
    external = lookup(normalizedCatalogs.external, key);
  if (internal && external && internal.label !== external.label)
    return { label: text + ' (مصدر الحالة غير محدد)', tone: 'neutral' };
  return internal ?? external ?? lookup(legacy, key) ?? { label: text, tone: 'neutral' };
}

export const localOrderStatusLabel = (value: string | null | undefined) =>
  orderStatusPresentation(value, 'internal').label;
const toneColors: Record<OrderTone, string> = {
  neutral: '#73847e',
  success: '#159a79',
  warning: '#d69224',
  info: '#3e86c6',
  danger: '#d7554d',
};
export const orderStatusColor = (
  value: string | null | undefined,
  mode: OrderDeliveryMode = 'internal',
) => toneColors[orderStatusPresentation(value, mode).tone];

export function deliveryStatusPresentation(
  value: string | null | undefined,
  mode: OrderDeliveryMode = 'unknown',
) {
  return value?.trim()
    ? orderStatusPresentation(value, mode)
    : {
        label: 'لا تتوفر حالة توصيل',
        tone: 'neutral' as const,
      };
}

export function orderTrackingStatus(
  order: Pick<IOrder, 'oliveryStatus' | 'deliveryStatus'>,
  mode: OrderDeliveryMode,
) {
  return (mode === 'external' ? order.oliveryStatus : order.deliveryStatus)?.trim() || null;
}

export const orderTrackingTitle = (mode: OrderDeliveryMode) =>
  mode === 'external' ? 'حالة الشحنة' : 'حالة التوصيل';
