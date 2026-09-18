import { useOrderQuery } from '@/api/shared/orders';
import { CustomText as Text, HeaderComponent, ScreenContainer } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import { statusLabel } from '@/components/shared/orders/statuses';
import { Button, Card, ui } from '@/components/shared/ui';
import { palette as p, typography as t } from '@/theme/tokens';
import type { ScreenProps } from '@/navigation/use-screen-props';
import type { Order } from '@/types/models';
import { ScrollView, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
type Props = ScreenProps & {
  actions?: React.ComponentType<{ order: Order }>;
  profit?: React.ComponentType<{ value?: number }>;
};
export default function OrderDetails({
  navigation,
  route,
  actions: Actions,
  profit: Profit,
}: Props) {
  const id = route.params.orderId ?? route.params.id;
  const query = useOrderQuery(String(id ?? ''), { skip: !id });
  const order = query.currentData;
  return (
    <ScreenContainer>
      <HeaderComponent title={id ? `طلب #${id}` : 'تفاصيل الطلب'} />
      <AsyncState
        loading={query.isLoading}
        error={query.error}
        empty={!id ? 'معرّف الطلب غير متوفر' : undefined}
        onRetry={query.refetch}
      />
      {order && (
        <ScrollView contentContainerStyle={ui.page}>
          <View style={s.hero}>
            <View style={ui.section}>
              <View style={s.status}>
                <View style={s.dot} />
                <Text style={ui.link}>{statusLabel(order.status)}</Text>
              </View>
              <Icon name="package-variant-closed" size={32} color={p.primary} />
            </View>
            <Text style={ui.caption}>إجمالي الطلب</Text>
            <Text style={s.amount}>
              {order.orderTotalUSD.toLocaleString('en-US')} <Text style={ui.caption}>USD</Text>
            </Text>
            {!!order.createdAt && (
              <Text style={ui.caption}>
                {new Date(order.createdAt).toLocaleDateString('ar-EG')}
              </Text>
            )}
          </View>
          <Card>
            <Text style={ui.title}>بيانات العميل</Text>
            <Text>العميل: {order.customerName}</Text>
            <Text>الهاتف: {order.customerMobile || 'غير متوفر'}</Text>
            <Text>
              العنوان:{' '}
              {[order.customerArea, order.customerAddress].filter(Boolean).join('، ') ||
                'غير متوفر'}
            </Text>
          </Card>
          <Card>
            <Text style={ui.title}>منتجات الطلب</Text>
            {order.items.map((item, index) => (
              <View style={s.item} key={String(item.productCode ?? item.id ?? index)}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.bold }}>
                    {String(item.productName ?? item.name ?? 'منتج')}
                  </Text>
                  <Text style={ui.caption}>الكمية: {String(item.quantity ?? 'غير متوفر')}</Text>
                  {!!item.color && <Text style={ui.caption}>اللون: {String(item.color)}</Text>}
                </View>
                <Text style={ui.link}>
                  {String(item.actualSellPriceUSD ?? item.price ?? '—')} USD
                </Text>
              </View>
            ))}
            {!order.items.length && <AsyncState empty="لا توجد تفاصيل منتجات لهذا الطلب" />}
            <View style={s.item}>
              <Text style={ui.caption}>رسوم التوصيل</Text>
              <Text>{order.deliveryFee ?? 'غير متوفر'} USD</Text>
            </View>
            {Profit && <Profit value={order.totalMerchantProfitUSD} />}
          </Card>
          <Button
            title="عرض سجل الطلب وتتبع الحالة"
            secondary
            icon="timeline-clock-outline"
            onPress={() => navigation.navigate('TrackOrder', { orderId: order.orderId })}
          />
          {Actions && (
            <Card>
              <Text style={ui.title}>تحديث الطلب</Text>
              <Text style={ui.caption}>اختر الحالة المناسبة للخطوة التي أنجزتها.</Text>
              <Actions key={String(order.orderId)} order={order} />
            </Card>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  hero: { backgroundColor: p.soft, padding: 24, borderRadius: 24, gap: 10 },
  status: { flexDirection: 'row-reverse', gap: 7, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 7, backgroundColor: p.primary },
  amount: { color: p.deep, fontSize: 36, lineHeight: 48, fontFamily: t.bold },
  item: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: p.border,
  },
});
