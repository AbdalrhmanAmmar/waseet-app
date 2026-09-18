import { useOrderHistoryQuery, useOrderQuery } from '@/api/shared/orders';
import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import { statusLabel } from '@/components/shared/orders/statuses';
import type { ScreenProps } from '@/navigation/use-screen-props';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Button, ui } from '@/components/shared/ui';
import { palette } from '@/theme/tokens';
import { Alert, Linking, ScrollView, View } from 'react-native';
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
        {order.data && (
          <CustomText style={ui.title}>الحالة الحالية: {statusLabel(order.data.status)}</CustomText>
        )}
        {history.currentData?.map((item, index) => (
          <Card key={String(item.id ?? index)} style={{ gap: 8 }}>
            <View style={ui.section}>
              <CustomText style={ui.link}>
                {statusLabel(item.toStatus ?? item.status ?? item.state ?? '')}
              </CustomText>
              <Icon name="circle-outline" size={20} color={palette.primary} />
            </View>
            {!!(item.note ?? item.notes) && <CustomText>{item.note ?? item.notes}</CustomText>}
            {!!(item.changedAt ?? item.createdAt) && (
              <CustomText>
                {new Date(item.changedAt ?? item.createdAt).toLocaleString('ar-EG')}
              </CustomText>
            )}
          </Card>
        ))}
        {!history.isLoading && !history.error && !history.data?.length && (
          <AsyncState empty="لا يوجد سجل لحالة الطلب حتى الآن" />
        )}
        {!!phone && (
          <Button
            title="الاتصال بمندوب التوصيل"
            icon="phone-outline"
            secondary
            onPress={() =>
              Linking.openURL(`tel:${String(phone).replace(/[^+\d]/g, '')}`).catch(() =>
                Alert.alert('تعذر فتح الاتصال'),
              )
            }
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
