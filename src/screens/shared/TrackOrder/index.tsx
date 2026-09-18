import { useOrderHistoryQuery, useOrderQuery } from '@/api/shared/orders';
import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import { statusLabel } from '@/components/shared/orders/statuses';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
export default function TrackOrder({ route }: ScreenProps) {
  const id = route.params.orderId ?? route.params.id;
  const order = useOrderQuery(String(id ?? ''), { skip: !id });
  const history = useOrderHistoryQuery(String(id ?? ''), { skip: !id });
  const phone = order.data?.courierPhone ?? order.data?.driverMobile;
  return (
    <ScreenContainer>
      <HeaderComponent title="تتبع الطلب" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <AsyncState
          loading={history.isLoading || order.isLoading}
          error={history.error ?? order.error}
          empty={!id ? 'معرّف الطلب غير متوفر' : undefined}
          onRetry={() => {
            history.refetch();
            order.refetch();
          }}
        />
        {order.data && <CustomText>الحالة الحالية: {statusLabel(order.data.status)}</CustomText>}
        {history.currentData?.map((item, index) => (
          <View
            key={String(item.id ?? index)}
            style={{ padding: 20, borderRadius: 14, backgroundColor: '#fff', gap: 8 }}
          >
            <CustomText>{statusLabel(item.toStatus ?? item.status ?? item.state ?? '')}</CustomText>
            {!!(item.note ?? item.notes) && <CustomText>{item.note ?? item.notes}</CustomText>}
            {!!(item.changedAt ?? item.createdAt) && (
              <CustomText>
                {new Date(item.changedAt ?? item.createdAt).toLocaleString('ar-EG')}
              </CustomText>
            )}
          </View>
        ))}
        {!history.isLoading && !history.error && !history.data?.length && (
          <AsyncState empty="لا يوجد سجل لحالة الطلب حتى الآن" />
        )}
        {!!phone && (
          <Pressable
            onPress={() =>
              Linking.openURL(`tel:${String(phone).replace(/[^+\d]/g, '')}`).catch(() =>
                Alert.alert('تعذر فتح الاتصال'),
              )
            }
          >
            <CustomText>الاتصال بمندوب التوصيل</CustomText>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
