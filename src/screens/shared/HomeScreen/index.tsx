import { useCallback, useState } from 'react';
import { AppState, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Text from '@/components/shared/CustomText';
import { Button } from '@/components/shared/ui';
import { BalanceCard } from '@/components/shared/home/BalanceCard';
import { OrderActivity } from '@/components/shared/home/OrderActivity';
import { OrderCounters } from '@/components/shared/home/OrderCounters';
import { RecentOrder } from '@/components/shared/home/RecentOrder';
import { s } from '@/components/shared/home/styles';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { GetUserProfile } from '@/store/slices/auth';
import { useHomeActivityQuery, homeApi } from '@/api/shared/home';
import { useOrdersQuery, ordersApi } from '@/api/shared/orders';
import { periodBounds } from '@/domain/home-orders';
import { palette as p } from '@/theme/tokens';
import type { ScreenProps } from '@/navigation/use-screen-props';
export default function HomeScreen({ navigation }: ScreenProps) {
  const router = useRouter();
  const { userData, role } = useSession();
  const dispatch = useAppDispatch();
  const [days, setDays] = useState<7 | 30>(7);
  const [bounds, setBounds] = useState(() => periodBounds(7));
  const [refreshing, setRefreshing] = useState(false);
  const userId = String(userData?.userId ?? '');
  const activityArgs = { userId, ...bounds, days };
  const activity = useHomeActivityQuery(activityArgs, {
    skip: !userData,
    refetchOnMountOrArgChange: 30,
  });
  const recent = useOrdersQuery(
    { page: 1, pageSize: 3 },
    { skip: !userData, refetchOnMountOrArgChange: 30 },
  );
  const refreshOrders = useCallback(async () => {
    if (!userId) return;
    const next = periodBounds(days);
    setBounds(next);
    await Promise.all([
      dispatch(
        homeApi.endpoints.homeActivity.initiate(
          { userId, ...next, days },
          { subscribe: false, forceRefetch: true },
        ),
      ),
      dispatch(
        ordersApi.endpoints.orders.initiate(
          { page: 1, pageSize: 3 },
          { subscribe: false, forceRefetch: true },
        ),
      ),
    ]);
  }, [dispatch, days, userId]);
  useFocusEffect(
    useCallback(() => {
      setBounds(periodBounds(days));
      let previous = AppState.currentState;
      const listener = AppState.addEventListener('change', (next) => {
        if (next === 'active' && previous !== 'active') void refreshOrders();
        previous = next;
      });
      return () => listener.remove();
    }, [days, refreshOrders]),
  );
  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshOrders(), userData && dispatch(GetUserProfile(userData.userId))]);
    } finally {
      setRefreshing(false);
    }
  };
  const greeting = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={p.primary}
          />
        }
      >
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.caption}>
              {greeting}، {userData?.firstName || 'بك'}
            </Text>
            <Text accessibilityRole="header" style={s.heading}>
              نظرة على حسابك
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="فتح حسابي"
            onPress={() => navigation.navigate('ProfileScreen')}
            style={s.avatar}
          >
            <Text style={s.initials}>{userData?.firstName?.[0] || 'و'}</Text>
          </Pressable>
        </View>
        {role === 'Merchant' ? (
          <BalanceCard key={userId} />
        ) : (
          <View style={[s.card, { backgroundColor: p.deep }]}>
            <Icon name="clipboard-check-outline" color="#C6E7DB" size={30} />
            <Text style={[s.heading, { color: '#fff' }]}>طلباتك، في مكان واحد</Text>
            <Text style={[s.caption, { color: '#C6E7DB' }]}>
              ابدأ طلب العميل وتابع تقدمه خطوة بخطوة.
            </Text>
          </View>
        )}
        {role === 'Merchant' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إدارة الموظفين"
            onPress={() => router.push('/merchant/employees')}
            style={[s.card, s.row]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.title}>إدارة الموظفين</Text>
              <Text style={s.caption}>فريق متجرك، والموافقات، وحالات الحسابات</Text>
            </View>
            <Icon name="account-group-outline" size={30} color={p.primary} />
            <Icon name="chevron-left" size={22} color={p.primary} />
          </Pressable>
        )}
        <View style={{ gap: 10 }}>
          <Button
            title="إنشاء طلب جديد"
            icon="plus"
            onPress={() => navigation.navigate('CreateOrder')}
            style={{ borderRadius: 18, minHeight: 56 }}
          />
          <Button
            title="متابعة الطلبات"
            icon="chevron-left"
            secondary
            onPress={() => navigation.navigate('MyOrders')}
            style={{ borderRadius: 18, backgroundColor: '#fff' }}
          />
        </View>
        <OrderCounters
          days={days}
          orders={activity.error ? undefined : activity.currentData}
          loading={activity.isFetching}
          onOpenOrder={(order) => navigation.navigate('OrderDetails', { orderId: order.orderId })}
        />
        <OrderActivity
          days={days}
          from={bounds.from}
          data={activity.currentData}
          busy={activity.isFetching}
          error={!!activity.error}
          onDays={(value) => {
            setDays(value);
            setBounds(periodBounds(value));
          }}
          onRetry={() => void refreshOrders()}
        />
        <View style={s.row}>
          <Text style={s.title}>آخر الطلبات</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="عرض كل الطلبات"
            onPress={() => navigation.navigate('MyOrders')}
            style={{ padding: 8 }}
          >
            <Text style={s.link}>عرض الكل</Text>
          </Pressable>
        </View>
        <View style={s.card}>
          {recent.isLoading ? (
            [1, 2, 3].map((key) => <View key={key} style={[s.skeleton, { height: 60 }]} />)
          ) : recent.error ? (
            <>
              <Text style={s.alert}>تعذر تحديث آخر الطلبات.</Text>
              <Button title="إعادة تحميل الطلبات" secondary onPress={() => void refreshOrders()} />
            </>
          ) : !recent.data?.items.length ? (
            <View style={s.empty}>
              <Icon name="package-variant-closed" color={p.primary} size={38} />
              <Text style={s.title}>ابدأ أول طلب لك</Text>
              <Text style={s.caption}>طلباتك الجديدة ستظهر هنا لمتابعتها بسهولة.</Text>
            </View>
          ) : null}
          {recent.data?.items.slice(0, 3).map((order) => (
            <RecentOrder
              key={order.orderId}
              order={order}
              onPress={() => navigation.navigate('OrderDetails', { orderId: order.orderId })}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
