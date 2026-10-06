import { useState } from 'react';
import { View } from 'react-native';
import { useOrderHistoryQuery } from '@/api/shared/orders';
import Text from '../CustomText';
import { Card, Button, ui } from '../ui';
import { AsyncState } from '../AsyncState';
import { statusLabel } from './statuses';
import type { Id } from '@/types/models';
const actorLabel = (value: unknown) => {
  const role = String(value ?? '').toLowerCase();
  if (/admin|management/.test(role)) return 'الإدارة';
  if (/merchant/.test(role)) return 'التاجر';
  if (/sales/.test(role)) return 'موظف المبيعات';
  if (/delivery|courier/.test(role)) return 'مندوب التوصيل';
  return !role || role === 'system' ? 'النظام' : String(value);
};
export const displayDate = (value: unknown) => {
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleString('ar-EG')
    : 'التاريخ غير متوفر';
};
export function OrderHistoryPanel({ id }: { id: Id }) {
  const query = useOrderHistoryQuery(id, { refetchOnMountOrArgChange: true });
  const [count, setCount] = useState(5);
  const events = [...(query.currentData ?? [])].sort(
    (a, b) => (Date.parse(b.changedAt) || 0) - (Date.parse(a.changedAt) || 0),
  );
  return (
    <Card>
      <Text style={ui.title}>سجل العمليات</Text>
      <Button
        title="تحديث سجل العمليات"
        secondary
        disabled={query.isFetching}
        onPress={() => void query.refetch()}
      />
      <AsyncState
        loading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
      {events.slice(0, count).map((item, i) => (
        <View
          key={i}
          style={{ borderRightWidth: 3, borderRightColor: '#147D64', padding: 12, gap: 6 }}
        >
          <Text style={ui.link}>
            {item.fromStatus
              ? `${statusLabel(item.fromStatus)} ← ${statusLabel(item.toStatus ?? '')}`
              : 'تم إنشاء الطلب'}
          </Text>
          <Text style={ui.caption}>
            {displayDate(item.changedAt)} ·{' '}
            {actorLabel(item.changedByRole ?? item.changedByActorType)}
            {item.changedById ? ` #${item.changedById}` : ''}
          </Text>
          {!!item.note && <Text>{String(item.note)}</Text>}
        </View>
      ))}
      {!query.isLoading && !query.error && !events.length && (
        <Text style={ui.caption}>لا توجد عمليات مسجلة حتى الآن.</Text>
      )}
      {events.length > 5 && (
        <Button
          title={count >= events.length ? 'عرض أقل' : 'عرض بقية السجل'}
          secondary
          onPress={() => setCount(count >= events.length ? 5 : count + 5)}
        />
      )}
    </Card>
  );
}
