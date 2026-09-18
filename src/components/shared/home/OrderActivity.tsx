import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { Button } from '../ui';
import { s } from './styles';
import { dailyOrders } from '@/domain/home-orders';
import type { Order } from '@/types/models';
import { palette as p } from '@/theme/tokens';
export function OrderActivity({
  days,
  from,
  data,
  busy,
  error,
  onDays,
  onRetry,
}: {
  days: number;
  from: string;
  data?: Order[];
  busy: boolean;
  error: boolean;
  onDays: (value: 7 | 30) => void;
  onRetry: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const buckets = useMemo(() => (data ? dailyOrders(data, from, days) : []), [data, from, days]);
  const max = Math.max(1, ...buckets.map((row) => row.count));
  const active = buckets.find((row) => row.key === selected);
  return (
    <View style={s.card} testID="order-activity">
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        <Text style={s.title}>حركة الطلبات</Text>
        <View style={s.segmented}>
          {([7, 30] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`آخر ${value} أيام`}
              accessibilityState={{ selected: value === days }}
              onPress={() => {
                setSelected(null);
                onDays(value);
              }}
              style={[s.segment, value === days && { backgroundColor: p.primary }]}
            >
              <Text style={{ color: value === days ? '#fff' : p.muted, fontSize: 12 }}>
                {value === 7 ? '7 أيام' : '30 يومًا'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {busy ? (
        <View accessibilityLabel="جارٍ تحميل حركة الطلبات" style={{ gap: 16 }}>
          <View style={[s.skeleton, { width: '45%', alignSelf: 'flex-end' }]} />
          <View style={[s.skeleton, { height: 125 }]} />
        </View>
      ) : error ? (
        <View style={{ gap: 12 }}>
          <Text style={s.alert}>تعذر تحميل بيانات الفترة كاملة. أعد المحاولة لعرض رسم دقيق.</Text>
          <Button title="إعادة تحميل الرسم" secondary onPress={onRetry} />
        </View>
      ) : data?.length === 0 ? (
        <View style={s.empty}>
          <Icon name="chart-bar" size={36} color={p.primary} />
          <Text style={s.title}>لا توجد طلبات في هذه الفترة</Text>
          <Text style={s.caption}>ابدأ طلبًا جديدًا لتتابع نشاطك هنا.</Text>
        </View>
      ) : data ? (
        <>
          <View>
            <Text style={s.statNumber} testID="period-total">
              {data.length} طلبًا
            </Text>
            <Text style={s.caption}>خلال آخر {days} أيام · حسب تاريخ الإنشاء</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={days === 30}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={{ flex: 1, minWidth: days === 30 ? 1040 : 0 }}>
              <View style={s.chart}>
                {buckets.map((row, index) => (
                  <Pressable
                    key={row.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.date.toLocaleDateString('ar-EG')}: ${row.count} طلب`}
                    accessibilityState={{ selected: selected === row.key }}
                    onPress={() => setSelected(row.key)}
                    style={s.barSlot}
                  >
                    <Text style={s.barText}>{row.count}</Text>
                    <View
                      style={[
                        s.bar,
                        {
                          height: Math.max(row.count ? 5 : 1, (row.count / max) * 106),
                          backgroundColor:
                            selected === row.key || index === buckets.length - 1
                              ? p.primary
                              : '#C6E7DB',
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 7, paddingHorizontal: 3 }}>
                {buckets.map((row) => (
                  <Text
                    key={row.key}
                    style={[
                      s.barText,
                      { flex: 1, minWidth: 27, textAlign: 'center', paddingTop: 6 },
                    ]}
                  >
                    {row.date.getDate()}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
          <Text style={s.caption} accessibilityLiveRegion="polite">
            {active
              ? `${active.date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })} · ${active.count} طلب`
              : days === 30
                ? 'اسحب الرسم أفقيًا، واضغط على اليوم لعرض تفاصيله'
                : 'اضغط على اليوم لعرض عدد الطلبات'}
          </Text>
        </>
      ) : null}
    </View>
  );
}
