import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { RecentOrder } from './RecentOrder';
import { s } from './styles';
import { orderOutcome, outcomeCounts, type OrderOutcome } from '@/domain/home-orders';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { palette as p } from '@/theme/tokens';
import type { Order } from '@/types/models';

type IconName = keyof typeof Icon.glyphMap;
type Counter = {
  key: OrderOutcome | 'total';
  title: string;
  icon: IconName;
  color: string;
  tint: string;
};
const PRIMARY: Counter[] = [
  {
    key: 'total',
    title: 'إجمالي الطلبات',
    icon: 'clipboard-text-outline',
    color: p.deep,
    tint: '#EEF3F0',
  },
  {
    key: 'processing',
    title: 'قيد المعالجة',
    icon: 'clock-outline',
    color: '#BC7B29',
    tint: '#FFF3DD',
  },
  {
    key: 'delivered',
    title: 'تم التسليم',
    icon: 'check-circle-outline',
    color: p.primary,
    tint: '#E2F6EC',
  },
];
const SECONDARY: Counter[] = [
  {
    key: 'refused',
    title: 'مرفوض',
    icon: 'close-octagon-outline',
    color: p.danger,
    tint: '#FCECEC',
  },
  { key: 'stuck', title: 'عالق', icon: 'alert-circle-outline', color: '#A9651C', tint: '#FFF1DF' },
  { key: 'cancelled', title: 'ملغي', icon: 'cancel', color: '#9A4545', tint: '#F8EDED' },
  { key: 'postponed', title: 'مؤجل', icon: 'calendar-clock', color: '#3E6E9C', tint: '#ECF3FE' },
];
const ALL = [...PRIMARY, ...SECONDARY];

export function OrderCounters({
  days,
  orders,
  loading,
  onOpenOrder,
}: {
  days: number;
  orders?: Order[];
  loading: boolean;
  onOpenOrder: (order: Order) => void;
}) {
  const [open, setOpen] = useState<Counter['key'] | null>(null);
  const counts = useMemo(() => (orders ? outcomeCounts(orders) : null), [orders]);
  const valueOf = (key: Counter['key']) =>
    !counts || !orders ? null : key === 'total' ? orders.length : counts[key];
  const tile = (counter: Counter, compact: boolean) => {
    const value = valueOf(counter.key);
    return (
      <Pressable
        key={counter.key}
        accessibilityRole="button"
        accessibilityLabel={`${counter.title}: ${value ?? 'غير متوفر'}`}
        accessibilityHint="عرض طلبات هذه الحالة"
        disabled={!value}
        onPress={() => setOpen(counter.key)}
        style={[s.stat, compact && styles.compact]}
      >
        <View style={[styles.badge, { backgroundColor: counter.tint }]}>
          <Icon name={counter.icon} size={compact ? 18 : 22} color={counter.color} />
        </View>
        <Text style={[s.caption, { textAlign: 'center' }, !compact && { minHeight: 42 }]}>
          {counter.title}
        </Text>
        {loading ? (
          <View style={[s.skeleton, { width: 30, height: compact ? 24 : 30 }]} />
        ) : (
          <Text style={[s.statNumber, compact && styles.compactNumber, { color: counter.color }]}>
            {value ?? '—'}
          </Text>
        )}
      </Pressable>
    );
  };
  return (
    <View style={{ gap: 8 }} testID="order-counters">
      <View style={s.row}>
        <Text style={s.title}>ملخص الطلبات</Text>
        <Text style={s.caption}>{days === 7 ? 'آخر 7 أيام' : 'آخر 30 يومًا'}</Text>
      </View>
      <View style={s.stats}>{PRIMARY.map((counter) => tile(counter, false))}</View>
      <View style={s.stats}>{SECONDARY.map((counter) => tile(counter, true))}</View>
      {!loading && !orders && (
        <Text style={s.caption}>الأعداد غير متاحة حتى يكتمل تحميل طلبات الفترة.</Text>
      )}
      {open && orders && (
        <OutcomeSheet
          counter={ALL.find((counter) => counter.key === open)!}
          orders={
            open === 'total' ? orders : orders.filter((order) => orderOutcome(order) === open)
          }
          days={days}
          onClose={() => setOpen(null)}
          onOpenOrder={(order) => {
            setOpen(null);
            onOpenOrder(order);
          }}
        />
      )}
    </View>
  );
}

function OutcomeSheet({
  counter,
  orders,
  days,
  onClose,
  onOpenOrder,
}: {
  counter: Counter;
  orders: Order[];
  days: number;
  onClose: () => void;
  onOpenOrder: (order: Order) => void;
}) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      ),
    [orders],
  );
  return (
    <Modal
      transparent
      visible
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        <View
          accessibilityViewIsModal
          testID="outcome-sheet"
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}
        >
          <View style={s.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text accessibilityRole="header" style={s.title}>
                {counter.title} · {orders.length}
              </Text>
              <Text style={s.caption}>
                طلبات {days === 7 ? 'آخر 7 أيام' : 'آخر 30 يومًا'} حسب تاريخ الإنشاء
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق قائمة الطلبات"
              onPress={onClose}
              style={styles.close}
            >
              <Icon name="close" size={22} color={p.deep} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
            {sorted.map((order) => (
              <RecentOrder
                key={order.orderId}
                order={order}
                badge={
                  counter.key === 'total'
                    ? undefined
                    : { label: counter.title, colors: [counter.tint, counter.color] }
                }
                onPress={() => onOpenOrder(order)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  compact: { minWidth: 56, paddingVertical: 12, paddingHorizontal: 4, gap: 6, borderRadius: 18 },
  compactNumber: { fontSize: 22, lineHeight: 32 },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0E2A2266' },
  sheet: {
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 6,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F3F0',
  },
});
