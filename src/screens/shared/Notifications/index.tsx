import { backendFeatures, unavailableMessages } from '@/config/features';
import { UnavailableFeature } from '@/components/shared/UnavailableFeature';
import { useNotificationsQuery } from '@/api/shared/account';
import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import { useSession } from '@/hooks/shared/use-session';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { FlatList, Pressable, View } from 'react-native';
export default function Notifications({ navigation }: ScreenProps) {
  const { userData } = useSession();
  const query = useNotificationsQuery(userData?.userId ?? '', {
    skip: !userData || !backendFeatures.notificationHistory,
  });
  if (!backendFeatures.notificationHistory)
    return (
      <UnavailableFeature title="الإشعارات" message={unavailableMessages.notificationHistory} />
    );
  return (
    <ScreenContainer>
      <HeaderComponent title="الإشعارات" />
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} />
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item, index) => String(item.id ?? item.notificationId ?? index)}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        refreshing={query.isFetching}
        onRefresh={query.refetch}
        ListEmptyComponent={
          !query.isLoading && !query.error ? <AsyncState empty="لا توجد إشعارات حاليًا" /> : null
        }
        renderItem={({ item }) => (
          <Pressable
            disabled={!item.orderId}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
          >
            <View style={{ padding: 20, gap: 8, backgroundColor: '#fff', borderRadius: 16 }}>
              <CustomText>{item.title ?? item.notification_title}</CustomText>
              <CustomText>{item.message ?? item.body ?? item.notification_body}</CustomText>
              {!!item.createdAt && (
                <CustomText>{new Date(item.createdAt).toLocaleString('ar-EG')}</CustomText>
              )}
            </View>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
