import { useOrdersQuery } from '@/api/shared/orders';
import { AsyncState } from '@/components/shared/AsyncState';
import { CustomText, OrderCard, ScreenContainer } from '@/components/shared/index';
import LinearGradient from '@/components/shared/LinearGradient';
import ProductCard from '@/components/shared/ProductCard/index';
import type { CatalogController } from '@/hooks/shared/use-catalog';
import { ScreenNames } from '@/navigation/ScreenNames';
import { styles } from '@/screens/shared/HomeScreen/styles';
import { addToCartLocal } from '@/store/slices/cart';
import { COLORS, hp, wp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

export default function HomeScreen({
  navigation,
  catalog,
}: {
  navigation: any;
  catalog: CatalogController;
}) {
  const dispatch = useDispatch<any>();
  const { userData } = useSelector((state: any) => state.AuthSlice);
  const orderQuery = useOrdersQuery({ page: 1, pageSize: 3 });
  const userOrders = { data: orderQuery.data?.items ?? [] };
  const [activeCategoryId, setActiveCategoryId] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  // role 'Merchant' (has wallets), role 'Sales' / other
  const isMerchant = userData?.role === 'Merchant';

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([catalog.refresh(), orderQuery.refetch()]);
    setRefreshing(false);
  };
  const rawProducts = catalog.data;
  const categories = ['All', ...new Set(rawProducts.map((item) => item.category))];

  const handleCategorySelect = (id: string) => {
    setActiveCategoryId(id);
  };

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === 'All') return rawProducts;
    return rawProducts.filter((b: any) => b.category === activeCategoryId);
  }, [activeCategoryId, rawProducts]);

  const handleAddToCart = (item: any) => {
    if (item.stock === 0 || item.quantity === 0) {
      Toast.show({
        type: 'error',
        text1: 'تنبيه',
        text2: 'هذا المنتج غير متوفر في المخزون حالياً',
      });
      return;
    }
    dispatch(addToCartLocal(item));
    Toast.show({ type: 'success', text1: 'تمت الإضافة للسلة' });
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.mainOrange]}
          />
        }
      >
        <AsyncState
          loading={catalog.loading}
          error={catalog.error || orderQuery.error}
          onRetry={onRefresh}
        />
        {/* ── Header Row ── */}
        <Animatable.View animation="fadeInDown" duration={500} style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <CustomText style={styles.greetingSmall}>صباح الخير،</CustomText>
            <CustomText style={styles.greetingName}>
              {' '}
              {userData?.firstName || 'المستخدم'} 👋
            </CustomText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => navigation.navigate(ScreenNames.ProductsScreen)}
            >
              <Icon name="magnify" size={hp(2.6)} color={COLORS.charcoal} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconActionBtn, { position: 'relative' }]}
              onPress={() =>
                navigation.navigate(ScreenNames.MenuStack, { screen: ScreenNames.Notifications })
              }
            >
              <Icon name="bell-outline" size={hp(2.6)} color={COLORS.charcoal} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => navigation.navigate(ScreenNames.ProfileScreen)}
            >
              <CustomText style={styles.avatarLetter}>
                {userData?.firstName?.charAt(0) || 'U'}
              </CustomText>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* ── Dollar Balance Card (From userData.dollarBalance) ── */}
        {isMerchant && (
          <Animatable.View animation="fadeInUp" delay={200} style={styles.walletsRow}>
            <LinearGradient
              colors={['#1E293B', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCardFull}
            >
              <View style={styles.walletHeader}>
                <View style={styles.walletHeaderLeft}>
                  <View style={styles.walletIconBox}>
                    <Icon name="currency-usd" size={hp(2.4)} color={COLORS.mainOrange} />
                  </View>
                  <View>
                    <CustomText style={styles.walletLabel}>رصيد المحفظة</CustomText>
                    <CustomText style={styles.walletCurrency}>الرصيد المتاح (USD)</CustomText>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <CustomText
                    style={{
                      color: COLORS.mainOrange,
                      fontSize: hp(1.3),
                      fontFamily: 'Montserrat-Bold',
                    }}
                  >
                    {isMerchant ? 'حساب تاجر' : userData?.role || 'مستخدم'}
                  </CustomText>
                </View>
              </View>
              <View style={styles.balanceValueRow}>
                <CustomText style={styles.walletBalanceAmount}>
                  {userData?.dollarBalance !== null && userData?.dollarBalance !== undefined
                    ? Number(userData.dollarBalance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '0.00'}
                </CustomText>
                <CustomText style={styles.walletCurrencySymbol}>$</CustomText>
              </View>
            </LinearGradient>
          </Animatable.View>
        )}

        {/* ── Latest Orders ── */}
        <View style={styles.sectionHeader}>
          <CustomText style={styles.sectionTitle}>أحدث الطلبات</CustomText>
          <TouchableOpacity onPress={() => navigation.navigate(ScreenNames.MyOrders)}>
            <CustomText style={styles.seeAll}>عرض الكل</CustomText>
          </TouchableOpacity>
        </View>
        <View style={styles.latestOrdersContainer}>
          {(Array.isArray(userOrders?.data) && userOrders.data.length > 0
            ? userOrders.data.slice(0, 3).map((item: any, idx: number) => ({
                id: item.orderId || item.id || idx,
                customer:
                  item.customerName || item.customer || `طلب #${item.orderId || item.id || idx}`,
                total:
                  item.totalPrice ??
                  item.totalAmount ??
                  item.total ??
                  item.actualSellPriceUSD ??
                  '0',
                status: item.status || item.orderStatus || 'قيد الانتظار',
                date: item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('ar-EG')
                  : item.date || '2026-09-08',
                ...item,
              }))
            : []
          ).map((order: any) => (
            <OrderCard
              key={String(order.orderId || order.id)}
              order={order}
              onPress={() =>
                navigation.navigate(ScreenNames.MenuStack, {
                  screen: ScreenNames.OrderDetails,
                  params: {
                    order_id: order.orderId || order.id,
                    orderId: order.orderId || order.id,
                  },
                })
              }
            />
          ))}
        </View>

        {/* ── Categories ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tabBtn, activeCategoryId === cat && styles.tabBtnActive]}
              onPress={() => handleCategorySelect(cat)}
            >
              <CustomText
                style={[styles.tabText, activeCategoryId === cat && styles.tabTextActive]}
              >
                {cat === 'All' ? 'الكل' : cat}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Products Grid ── */}
        <View style={{ paddingHorizontal: wp(3), marginTop: hp(1.5) }}>
          <FlatList
            data={filteredProducts}
            numColumns={2}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            keyExtractor={(item) => String(item.id)}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: hp(2) }}
            renderItem={({ item, index }) => (
              <ProductCard
                item={item}
                index={index}
                onPress={() => navigation.navigate(ScreenNames.ProductDetails, { product: item })}
                onAddToCart={() => handleAddToCart(item)}
              />
            )}
            ListEmptyComponent={
              <CustomText style={{ textAlign: 'center', marginTop: 20, width: wp(90) }}>
                لا توجد منتجات حالياً.
              </CustomText>
            }
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
