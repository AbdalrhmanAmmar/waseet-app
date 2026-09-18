import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import { orderStatuses, statusLabel } from '@/components/shared/orders/statuses';
import type { useOrderList } from '@/hooks/shared/use-order-list';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
type Props = ScreenProps & {
  title: string;
  controller: ReturnType<typeof useOrderList>;
  summary?: React.ReactNode;
};
export default function OrdersScreen({ navigation, title, controller, summary }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const filtered = useMemo(
    () =>
      controller.orders.filter(
        (order) =>
          (!status || order.status === status) &&
          `${order.orderId} ${order.customerName} ${order.customerMobile ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [controller.orders, status, search],
  );
  return (
    <ScreenContainer>
      <HeaderComponent title={title} showBack={false} />
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="ابحث في الطلبات المحملة بالرقم أو العميل"
      />
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {[{ value: '', label: 'الكل' }, ...orderStatuses].map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setStatus(item.value)}
              style={[styles.pill, item.value === status && styles.selected]}
            >
              <CustomText>{item.label}</CustomText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {summary}
      <AsyncState
        loading={controller.loading}
        error={controller.error}
        onRetry={controller.refresh}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.orderId)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={controller.fetching && !!controller.orders.length}
            onRefresh={controller.refresh}
          />
        }
        onEndReached={controller.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !controller.loading && !controller.error ? (
            <AsyncState empty="لا توجد طلبات مطابقة" />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
          >
            <CustomText style={styles.title}>طلب #{item.orderId}</CustomText>
            <CustomText>{item.customerName}</CustomText>
            <CustomText>{statusLabel(item.status)}</CustomText>
            <CustomText>{item.orderTotalUSD} USD</CustomText>
            {!!item.createdAt && (
              <CustomText>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</CustomText>
            )}
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  search: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  filters: { padding: 16, gap: 8 },
  pill: { padding: 10, borderRadius: 16, backgroundColor: '#fff' },
  selected: { backgroundColor: '#FADCCC' },
  list: { padding: 16 },
  card: { padding: 20, borderRadius: 16, backgroundColor: '#fff', marginBottom: 12, gap: 8 },
  title: { fontWeight: 'bold', color: '#E65317' },
});
