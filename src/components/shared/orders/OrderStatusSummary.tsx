import { View } from 'react-native';
import Text from '../CustomText';
import type { Order } from '@/types/models';
import type { DeliveryMode } from '@/domain/order-workflow';
import { orderStatusPresentation } from '@/domain/order-status-presentation';
const tones = {
  neutral: ['#F0F3F2', '#596B63'],
  success: ['#EAF6EF', '#147D64'],
  warning: ['#FFF3DD', '#86551D'],
  info: ['#ECF3FE', '#285C94'],
  danger: ['#FCECEC', '#B83D3D'],
};
export function OrderStatusSummary({
  order,
  mode,
  showMode = true,
}: {
  order: Order;
  mode: DeliveryMode;
  showMode?: boolean;
}) {
  const rows = [{ title: 'حالة الطلب', value: order.status, source: 'internal' as const }];
  const tracking =
    mode === 'external'
      ? [
          { title: 'حالة زحل', value: order.oliveryStatus, source: 'external' as const },
          { title: 'حالة التوصيل', value: order.deliveryStatus, source: 'external' as const },
        ]
      : order.deliveryStatus
        ? [{ title: 'حالة التوصيل', value: order.deliveryStatus, source: 'internal' as const }]
        : [];
  return (
    <View style={{ gap: 8 }}>
      {showMode && (
        <Text style={{ fontSize: 12, color: '#677A70' }}>
          {mode === 'internal'
            ? 'توصيل داخلي'
            : mode === 'external'
              ? 'حالة زحل'
              : 'نوع التوصيل غير محدد'}
          {order.orderType?.toLowerCase() === 'return' ? ' · طلب مرتجع' : ''}
        </Text>
      )}
      {[...rows, ...tracking].map((row) => {
        const item = orderStatusPresentation(row.value, row.source);
        const [backgroundColor, color] = tones[item.tone];
        return (
          <View key={row.title} style={{ gap: 4, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: '#677A70' }}>{row.title}</Text>
            <View
              style={{
                backgroundColor,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                maxWidth: '100%',
              }}
            >
              <Text style={{ color, fontSize: 13, lineHeight: 22, flexShrink: 1 }}>
                {row.value?.trim()
                  ? item.label
                  : mode === 'external' && row.title === 'حالة التوصيل'
                    ? 'لا توجد حالة توصيل منفصلة لهذه المرحلة'
                    : 'غير متاحة حاليًا'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
