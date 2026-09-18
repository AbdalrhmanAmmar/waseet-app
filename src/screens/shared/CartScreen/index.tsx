import {
  CustomText,
  CustomTextInput,
  GradientBtn,
  HeaderComponent,
  ScreenContainer,
} from '@/components/shared/index';
import { ScreenNames } from '@/navigation/ScreenNames';
import { styles } from '@/screens/shared/CartScreen/styles';
import {
  clearCartLocal,
  removeFromCartLocal,
  updateCartItemPriceLocal,
  updateCartQuantityLocal,
} from '@/store/slices/cart';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function CartScreen({ navigation }: { navigation: any }) {
  const dispatch = useDispatch<any>();
  const { userData } = useSelector((state: any) => state.AuthSlice);
  const { userCart } = useSelector((state: any) => state.cart);
  const cartItems = userCart?.data || [];

  const isMerchant = userData?.role === 'Merchant' || userData?.role?.toLowerCase() === 'merchant';

  const updateQty = (cartId: string, newQty: number) => {
    dispatch(updateCartQuantityLocal({ cart_id: cartId, quantity: newQty }));
  };

  const updatePrice = (cartId: string, newPrice: string) => {
    dispatch(updateCartItemPriceLocal({ cart_id: cartId, sellingPrice: newPrice }));
  };

  const removeItem = (cartId: string) => {
    dispatch(removeFromCartLocal(cartId));
  };

  const clearAll = () => {
    dispatch(clearCartLocal());
  };

  const subtotal = cartItems.reduce(
    (acc: number, curr: any) =>
      acc + Number(curr.sellingPrice ?? curr.price ?? 0) * Number(curr.quantity || 1),
    0,
  );

  return (
    <ScreenContainer>
      <HeaderComponent
        title="سلة المشتريات"
        rightComponent={
          cartItems.length > 0 ? (
            <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
              <Icon name="trash-can-outline" size={hp(2.2)} color="#e74c3c" />
              <CustomText style={styles.clearBtnText}>تفريغ</CustomText>
            </TouchableOpacity>
          ) : null
        }
      />

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cart-off" size={hp(8)} color={COLORS.gray} />
          <CustomText style={styles.emptyText}>السلة فارغة حالياً</CustomText>
          <GradientBtn
            text="تصفح المنتجات"
            onPress={() => navigation.navigate(ScreenNames.HomeScreen)}
            containerStyle={styles.exploreBtn}
            colors={[COLORS.mainOrange, '#f08b5e']}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {cartItems.map((item: any) => {
            const itemId = String(item.cart_id || item.productCode || item.id);
            return (
              <View key={itemId} style={styles.cartItem}>
                <Image source={{ uri: item.image || item.imageUrl }} style={styles.productCover} />

                <View style={styles.itemInfo}>
                  <CustomText style={styles.itemTitle} numberOfLines={2}>
                    {item.title || item.name}
                  </CustomText>
                  <CustomText style={styles.itemEdition}>{item.category || 'عام'}</CustomText>
                  {item.stock === 0 && (
                    <CustomText
                      style={{
                        color: '#EF4444',
                        fontSize: hp(1.2),
                        marginTop: 2,
                        fontFamily: 'Montserrat-Medium',
                      }}
                    >
                      ⚠️ غير متوفر بالمخزون
                    </CustomText>
                  )}

                  {isMerchant && item.merchantSellPrice !== undefined && (
                    <CustomText
                      style={{
                        color: '#64748B',
                        fontSize: hp(1.2),
                        marginTop: 2,
                        fontFamily: 'Montserrat-Medium',
                      }}
                    >
                      سعرك (التكلفة): {item.merchantSellPrice} $
                    </CustomText>
                  )}

                  {/* Price Input */}
                  <View style={styles.priceEditRow}>
                    <CustomText style={styles.priceLabel}>سعر البيع:</CustomText>
                    <CustomTextInput
                      value={String(item.sellingPrice ?? item.price ?? 0)}
                      onChangeText={(v) => updatePrice(itemId, v)}
                      keyboardType="numeric"
                      containerStyle={styles.priceInputContainer}
                      style={styles.priceInput}
                    />
                    <CustomText style={styles.currencyLabel}>$</CustomText>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  <TouchableOpacity onPress={() => removeItem(itemId)} style={styles.deleteBtn}>
                    <Icon name="delete-outline" size={hp(2.4)} color="#e74c3c" />
                  </TouchableOpacity>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(itemId, (item.quantity || 1) + 1)}
                    >
                      <Icon name="plus" size={hp(1.6)} color={COLORS.charcoal} />
                    </TouchableOpacity>
                    <CustomText style={styles.qtyText}>{item.quantity || 1}</CustomText>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(itemId, (item.quantity || 1) - 1)}
                    >
                      <Icon name="minus" size={hp(1.6)} color={COLORS.charcoal} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <CustomText style={styles.summaryLabel}>المجموع</CustomText>
              <CustomText style={styles.summaryValue}>{subtotal.toFixed(2)} $</CustomText>
            </View>
          </View>

          <GradientBtn
            text={'إتمام الطلب'}
            onPress={() => navigation.navigate(ScreenNames.CheckoutScreen, { subtotal, cartItems })}
            colors={[COLORS.mainOrange, '#f08b5e']}
            leftIcon={<Icon name="arrow-left" size={hp(2.1)} color={COLORS.white} />}
          />
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
