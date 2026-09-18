import { useOrderQuery } from '@/api/shared/orders';
import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import { statusLabel } from '@/components/shared/orders/statuses';
import type { ScreenProps } from '@/navigation/use-screen-props';
import type { Order } from '@/types/models';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <CustomText>{statusLabel(order.status)}</CustomText>
            <CustomText>العميل: {order.customerName}</CustomText>
            <CustomText>الهاتف: {order.customerMobile || 'غير متوفر'}</CustomText>
            <CustomText>
              العنوان: {order.customerArea} {order.customerAddress}
            </CustomText>
            <CustomText>الإجمالي: {order.orderTotalUSD} USD</CustomText>
            <CustomText>التوصيل: {order.deliveryFee ?? 'غير متوفر'} USD</CustomText>
            {Profit && <Profit value={order.totalMerchantProfitUSD} />}
          </View>
          {order.items.map((item, index) => (
            <View style={styles.card} key={String(item.productCode ?? item.id ?? index)}>
              <CustomText>{String(item.productName ?? item.name ?? 'منتج')}</CustomText>
              <CustomText>الكمية: {String(item.quantity ?? 'غير متوفر')}</CustomText>
              <CustomText>
                السعر: {String(item.actualSellPriceUSD ?? item.price ?? 'غير متوفر')} USD
              </CustomText>
            </View>
          ))}
          {!order.items.length && <AsyncState empty="لا توجد تفاصيل منتجات لهذا الطلب" />}
          <Pressable
            onPress={() => navigation.navigate('TrackOrder', { orderId: order.orderId })}
            style={styles.card}
          >
            <CustomText>عرض سجل الطلب وتتبع الحالة ←</CustomText>
          </Pressable>
          {Actions && <Actions key={String(order.orderId)} order={order} />}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 10 },
});
