import { useProductDetailsQuery } from '@/api/shared/catalog';
import { HeaderComponent, ScreenContainer, CustomText } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import LinearGradient from '@/components/shared/LinearGradient';
import { styles } from '@/screens/shared/ProductDetails/styles';
import { addToCartLocal, removeFromCartLocal, updateCartQuantityLocal } from '@/store/slices/cart';
import { COLORS, hp, wp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ProductDetailsContent = ({ navigation, route }: { navigation: any; route: any }) => {
  const dispatch = useDispatch<any>();
  const insets = useSafeAreaInsets();
  const { userData } = useSelector((state: any) => state.AuthSlice);
  const { userCart } = useSelector((state: any) => state.cart);
  const { product: initialProduct } = route.params || {};

  const item = initialProduct;
  const itemCode = String(item.productCode || item.id || item.cart_id);
  const isMerchant = userData?.role === 'Merchant' || userData?.role?.toLowerCase() === 'merchant';

  const priceCards = useMemo(() => {
    return [
      {
        id: 'original',
        label: 'السعر الأصلي',
        value:
          item.originalSellPrice ??
          item.originalPrice ??
          item.basePrice ??
          item.costPrice ??
          item.price ??
          0,
        icon: 'currency-usd',
        iconColor: '#EA580C',
        iconBg: '#FFF3E0',
        highlighted: false,
      },
      ...(isMerchant
        ? [
            {
              id: 'merchant',
              label: 'سعر التاجر',
              value:
                item.merchantSellPrice !== undefined && item.merchantSellPrice !== null
                  ? item.merchantSellPrice
                  : item.price,
              icon: 'storefront-outline',
              iconColor: '#0D9488',
              iconBg: '#D1FAE5',
              highlighted: true,
            },
          ]
        : []),
      {
        id: 'expected',
        label: isMerchant ? 'السعر المتوقع' : 'سعر البيع المقترح',
        value:
          item.effectiveExpectedSellPrice !== undefined && item.effectiveExpectedSellPrice !== null
            ? item.effectiveExpectedSellPrice
            : (item.expectedSellPrice ?? item.price),
        icon: 'shopping-outline',
        iconColor: '#0D9488',
        iconBg: '#E6F8F4',
        highlighted: !isMerchant,
      },
    ];
  }, [item, isMerchant]);

  const cartItem = (userCart?.data || []).find(
    (c: any) => String(c.productCode || c.id || c.cart_id) === itemCode,
  );
  const isInCart = Boolean(cartItem);
  const cartQuantity = cartItem ? cartItem.quantity : 1;

  const isOutOfStock = item.quantity === 0 || item.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
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

  const handleQuantityChange = (diff: number) => {
    const newQty = (cartItem?.quantity || 1) + diff;
    if (newQty < 1) {
      dispatch(removeFromCartLocal(itemCode));
      Toast.show({ type: 'info', text1: 'تمت إزالة المنتج من السلة' });
    } else {
      dispatch(updateCartQuantityLocal({ cart_id: itemCode, quantity: newQty }));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header Overlay */}
        <View style={[styles.headerFloating, { paddingTop: insets.top + hp(1) }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-right" size={hp(2.6)} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Background */}
        <View style={styles.heroSection}>
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} blurRadius={10} />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', COLORS.white]}
            style={StyleSheet.absoluteFill}
          />
          <Animatable.View animation="fadeInDown" duration={1000} style={styles.productWrapper}>
            <Image source={{ uri: item.image }} style={styles.productCover} resizeMode="contain" />
          </Animatable.View>
        </View>

        <View style={styles.contentMain}>
          <View style={styles.metaInfo}>
            <View style={styles.mainTag}>
              <CustomText style={styles.mainTagText}>{item.category}</CustomText>
            </View>
            {isOutOfStock ? (
              <View style={[styles.mainTag, { backgroundColor: '#FEE2E2' }]}>
                <CustomText style={[styles.mainTagText, { color: '#EF4444' }]}>
                  نفدت الكمية (0 متوفر)
                </CustomText>
              </View>
            ) : (
              <View style={[styles.mainTag, { backgroundColor: '#DCFCE7' }]}>
                <CustomText style={[styles.mainTagText, { color: '#16A34A' }]}>
                  متوفر بالمخزون
                </CustomText>
              </View>
            )}
          </View>

          <Animatable.Text animation="fadeInUp" delay={200} style={styles.productTitle}>
            {item.title || item.name}
          </Animatable.Text>
          <Animatable.Text animation="fadeInUp" delay={300} style={styles.authorName}>
            {item.author || item.description}
          </Animatable.Text>

          {/* Pricing Details Cards (Rendered dynamically via FlatList) */}
          <Animatable.View
            animation="fadeInUp"
            delay={350}
            style={{ marginVertical: hp(2), width: '100%' }}
          >
            <FlatList
              data={priceCards}
              keyExtractor={(item) => item.id}
              horizontal
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              style={{ width: '100%' }}
              contentContainerStyle={styles.priceCardsContainer}
              ItemSeparatorComponent={() => (
                <View style={styles.priceStepArrow}>
                  <Icon name="arrow-left" size={hp(2.0)} color="#94A3B8" />
                </View>
              )}
              renderItem={({ item: card }) => (
                <View
                  style={[
                    styles.priceStepCard,
                    card.highlighted && styles.priceStepCardHighlighted,
                    isMerchant ? { width: wp(25) } : { width: wp(40) },
                  ]}
                >
                  <View style={[styles.priceCardIconBox, { backgroundColor: card.iconBg }]}>
                    <Icon
                      name={card.icon as React.ComponentProps<typeof Icon>['name']}
                      size={hp(2.0)}
                      color={card.iconColor}
                    />
                  </View>
                  <CustomText
                    style={[
                      styles.priceCardLabel,
                      card.highlighted && styles.priceCardLabelMerchant,
                    ]}
                  >
                    {card.label}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.priceCardValue,
                      card.highlighted && styles.priceCardValueMerchant,
                    ]}
                  >
                    ${card.value}
                  </CustomText>
                </View>
              )}
            />
          </Animatable.View>

          <View style={styles.descriptionSection}>
            <CustomText style={styles.sectionTitle}>الوصف</CustomText>
            <CustomText style={styles.descriptionText}>{item.description}</CustomText>
          </View>

          <View style={{ height: hp(15) }} />
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <Animatable.View
        animation="slideInUp"
        duration={800}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + hp(1.5) }]}
      >
        <View style={styles.priceSection}>
          <CustomText style={styles.priceTag}>
            {isMerchant
              ? `${item.merchantSellPrice !== undefined ? item.merchantSellPrice : item.price} $`
              : `${item.effectiveExpectedSellPrice !== undefined ? item.effectiveExpectedSellPrice : item.price} $`}
          </CustomText>
          <CustomText style={styles.vatInfo}>
            {isMerchant ? 'سعرك (تكلفة الشراء)' : 'سعر البيع المقترح'}
          </CustomText>
        </View>
        <View style={styles.actionRow}>
          {!isInCart ? (
            <TouchableOpacity style={styles.primaryAction} onPress={handleAddToCart}>
              <LinearGradient colors={[COLORS.mainOrange, '#f08b5e']} style={styles.gradientCta}>
                <Icon name="cart-plus" size={hp(2.1)} color={COLORS.white} />
                <CustomText style={styles.ctaText}>إضافة للسلة</CustomText>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.primaryAction,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: COLORS.mainOrange,
                  borderRadius: hp(3.5),
                  overflow: 'hidden',
                },
              ]}
            >
              <TouchableOpacity
                style={{ padding: hp(1.5), paddingHorizontal: hp(2.5) }}
                onPress={() => handleQuantityChange(-1)}
              >
                <Icon name="minus" size={hp(2.2)} color={COLORS.white} />
              </TouchableOpacity>
              <CustomText style={{ color: COLORS.white, fontSize: hp(1.8), fontWeight: 'bold' }}>
                {cartQuantity}
              </CustomText>
              <TouchableOpacity
                style={{ padding: hp(1.5), paddingHorizontal: hp(2.5) }}
                onPress={() => handleQuantityChange(1)}
              >
                <Icon name="plus" size={hp(2.2)} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animatable.View>
    </View>
  );
};

export default function ProductDetails(props: { navigation: any; route: any }) {
  const initial = props.route.params?.product;
  const id = props.route.params?.id;
  const { userData } = useSelector((state: any) => state.AuthSlice);
  const query = useProductDetailsQuery(
    { product_id: id, user_id: userData?.userId },
    { skip: !!initial || !id },
  );
  const item = initial ?? query.currentData;
  if (!item)
    return (
      <ScreenContainer>
        <HeaderComponent title="تفاصيل المنتج" />
        <AsyncState
          loading={query.isLoading}
          error={query.error}
          empty={!id ? 'اختر منتجًا من القائمة' : undefined}
          onRetry={query.refetch}
        />
      </ScreenContainer>
    );
  return <ProductDetailsContent {...props} route={{ params: { product: item } }} />;
}
