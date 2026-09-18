import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useOrdersQuery } from '@/api/shared/orders';
import { CustomText as Text, ScreenContainer, OrderCard } from '@/components/shared';
import ProductCard from '@/components/shared/ProductCard';
import { AsyncState } from '@/components/shared/AsyncState';
import { Brand, SectionTitle, ui } from '@/components/shared/ui';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import type { CatalogController } from '@/hooks/shared/use-catalog';
import { addToCartLocal } from '@/store/slices/cart';
import { roleLabels } from '@/auth/roles';
import { palette as p, typography as t } from '@/theme/tokens';
import type { ScreenProps } from '@/navigation/use-screen-props';
export default function HomeScreen({
  navigation,
  catalog,
}: {
  navigation: ScreenProps['navigation'];
  catalog: CatalogController;
}) {
  const { userData, role } = useSession();
  const dispatch = useAppDispatch();
  const orders = useOrdersQuery({ page: 1, pageSize: 3 });
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([catalog.refresh(), orders.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={p.primary} />
        }
      >
        <View style={ui.section}>
          <Brand compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="فتح القائمة"
            onPress={() => navigation.navigate('MenuScreen')}
            style={s.menu}
          >
            <Icon name="menu" size={24} color={p.ink} />
          </Pressable>
        </View>
        <View>
          <Text style={s.greeting}>أهلًا، {userData?.firstName || 'بك'}</Text>
          <Text style={ui.caption}>{role ? roleLabels[role] : ''} · لننجز المزيد اليوم</Text>
        </View>
        <View style={s.hero}>
          <View style={ui.section}>
            <Text style={s.heroLabel}>{role === 'Merchant' ? 'رصيد حسابك' : 'مساحة المبيعات'}</Text>
            <Icon
              name={role === 'Merchant' ? 'wallet-outline' : 'chart-line'}
              size={25}
              color="#B5D8C6"
            />
          </View>
          <Text style={s.balance}>
            {role === 'Merchant'
              ? userData?.dollarBalance != null
                ? `${Number(userData.dollarBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
                : 'الرصيد غير متوفر'
              : 'من المنتج إلى الطلب'}
          </Text>
          <Text style={s.heroHint}>
            {role === 'Merchant'
              ? 'تابع رصيدك وتفاصيل طلباتك من مكان واحد.'
              : 'اختر المنتجات وجهّز طلب العميل بخطوات بسيطة.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ProductsScreen')}
            style={s.heroAction}
          >
            <Text style={s.heroActionText}>ابدأ طلبًا جديدًا</Text>
            <Icon name="arrow-left" size={19} color={p.deep} />
          </Pressable>
        </View>
        <View style={s.stats}>
          <Pressable
            accessibilityRole="button"
            style={s.stat}
            onPress={() => navigation.navigate('ProductsScreen')}
          >
            <Icon name="package-variant-closed" size={23} color={p.primary} />
            <Text style={s.statNumber}>
              {catalog.loading || catalog.error ? '—' : catalog.totalCount}
            </Text>
            <Text style={ui.caption}>منتج في الكتالوج</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={s.stat}
            onPress={() => navigation.navigate('MyOrders')}
          >
            <Icon name="clipboard-list-outline" size={23} color={p.primary} />
            <Text style={s.statNumber}>{orders.data?.totalCount ?? '—'}</Text>
            <Text style={ui.caption}>طلب في حسابك</Text>
          </Pressable>
        </View>
        <SectionTitle
          title="اكتشف المنتجات"
          subtitle="اختر ما يناسب طلب عميلك"
          action="عرض الكل"
          onPress={() => navigation.navigate('ProductsScreen')}
        />
        <AsyncState
          loading={catalog.loading}
          error={catalog.error}
          onRetry={catalog.refresh}
          empty={
            !catalog.loading && !catalog.error && !catalog.data.length
              ? 'لا توجد منتجات حاليًا'
              : undefined
          }
        />
        <View style={s.products}>
          {catalog.data.slice(0, 4).map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('ProductDetails', { product: item })}
              onAddToCart={() => dispatch(addToCartLocal(item))}
            />
          ))}
        </View>
        <SectionTitle
          title="آخر الطلبات"
          action="عرض الكل"
          onPress={() => navigation.navigate('MyOrders')}
        />
        <AsyncState
          loading={orders.isLoading}
          error={orders.error}
          onRetry={orders.refetch}
          empty={
            !orders.isLoading && !orders.error && !orders.data?.items.length
              ? 'طلباتك الجديدة ستظهر هنا'
              : undefined
          }
        />
        <View>
          {orders.data?.items.map((order) => (
            <OrderCard
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
const s = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 22,
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  menu: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: p.border,
    backgroundColor: p.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { fontSize: 26, lineHeight: 38, fontFamily: t.bold },
  hero: { backgroundColor: p.deep, borderRadius: 26, padding: 24, gap: 12 },
  heroLabel: { color: '#C6E2D3', fontSize: 14 },
  balance: { color: '#fff', fontFamily: t.bold, fontSize: 28, lineHeight: 40 },
  heroHint: { color: '#C6E2D3', fontSize: 13 },
  heroAction: {
    backgroundColor: p.accent,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  heroActionText: { color: p.deep, fontFamily: t.bold },
  stats: { flexDirection: 'row-reverse', gap: 12 },
  stat: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: p.border,
    backgroundColor: p.surface,
    alignItems: 'flex-end',
    gap: 6,
  },
  statNumber: { fontSize: 25, lineHeight: 34, fontFamily: t.bold },
  products: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
});
