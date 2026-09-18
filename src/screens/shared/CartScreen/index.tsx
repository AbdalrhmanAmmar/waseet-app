import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import {
  CustomText as Text,
  CustomTextInput,
  HeaderComponent,
  ScreenContainer,
} from '@/components/shared';
import { Button, Card, ui } from '@/components/shared/ui';
import { useAppDispatch, useAppSelector } from '@/hooks/shared/use-store';
import {
  clearCartLocal,
  removeFromCartLocal,
  updateCartItemPriceLocal,
  updateCartQuantityLocal,
} from '@/store/slices/cart';
import type { ScreenProps } from '@/navigation/use-screen-props';
import type { CartItem } from '@/types/models';
import Images from '@/theme/images';
import { palette as p, typography as t } from '@/theme/tokens';
function Item({ item, merchant }: { item: CartItem; merchant: boolean }) {
  const dispatch = useAppDispatch();
  const [failed, setFailed] = useState(false);
  const [price, setPrice] = useState(String(item.sellingPrice));
  const valid = price.trim() !== '' && Number.isFinite(Number(price)) && Number(price) >= 0;
  return (
    <Card>
      <View style={s.row}>
        <Image
          source={!failed && item.image ? { uri: item.image } : Images.brandLogo}
          onError={() => setFailed(true)}
          style={s.image}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.name}>{item.title}</Text>
          <Text style={ui.caption}>{item.category}</Text>
          {merchant && item.merchantSellPrice != null && (
            <Text style={ui.caption}>التكلفة: {item.merchantSellPrice.toFixed(2)} USD</Text>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`حذف ${item.title}`}
          onPress={() => dispatch(removeFromCartLocal(item.cart_id))}
          style={s.icon}
        >
          <Icon name="trash-can-outline" size={23} color={p.danger} />
        </Pressable>
      </View>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <CustomTextInput
            label="سعر البيع (USD)"
            accessibilityLabel={`سعر بيع ${item.title}`}
            value={price}
            keyboardType="decimal-pad"
            onChangeText={(value) => {
              setPrice(value);
              if (value.trim() && Number.isFinite(Number(value)) && Number(value) >= 0)
                dispatch(updateCartItemPriceLocal({ cart_id: item.cart_id, sellingPrice: value }));
            }}
            onBlur={() => setPrice(String(item.sellingPrice))}
            containerStyle={{ marginBottom: 0 }}
          />
          {!valid && (
            <Text style={{ color: p.danger, fontSize: 12 }}>
              أدخل سعرًا صحيحًا؛ لم يتم تغيير السعر المحفوظ.
            </Text>
          )}
        </View>
        <View style={{ gap: 8 }}>
          <Text style={ui.caption}>الكمية</Text>
          <View style={s.quantity}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`زيادة كمية ${item.title}`}
              disabled={item.quantity >= item.stock}
              accessibilityState={{ disabled: item.quantity >= item.stock }}
              onPress={() =>
                dispatch(
                  updateCartQuantityLocal({ cart_id: item.cart_id, quantity: item.quantity + 1 }),
                )
              }
              style={[s.icon, item.quantity >= item.stock && { opacity: 0.35 }]}
            >
              <Icon name="plus" size={20} color={p.primary} />
            </Pressable>
            <Text style={s.name}>{item.quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`تقليل كمية ${item.title}`}
              disabled={item.quantity <= 1}
              accessibilityState={{ disabled: item.quantity <= 1 }}
              onPress={() =>
                dispatch(
                  updateCartQuantityLocal({ cart_id: item.cart_id, quantity: item.quantity - 1 }),
                )
              }
              style={[s.icon, item.quantity <= 1 && { opacity: 0.35 }]}
            >
              <Icon name="minus" size={20} color={p.primary} />
            </Pressable>
          </View>
        </View>
      </View>
      <View style={ui.section}>
        <Text style={ui.caption}>إجمالي المنتج</Text>
        <Text style={ui.link}>{(item.sellingPrice * item.quantity).toFixed(2)} USD</Text>
      </View>
    </Card>
  );
}
export default function CartScreen({ navigation }: ScreenProps) {
  const dispatch = useAppDispatch();
  const { data: items, totalPrice } = useAppSelector((state) => state.cart.userCart);
  const merchant = useAppSelector((state) => state.AuthSlice.userData?.role === 'Merchant');
  return (
    <ScreenContainer>
      <HeaderComponent
        title="سلة المشتريات"
        showBack={false}
        rightComponent={
          items.length ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تفريغ السلة"
              onPress={() => dispatch(clearCartLocal())}
              style={s.icon}
            >
              <Icon name="trash-can-outline" size={23} color={p.danger} />
            </Pressable>
          ) : undefined
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[ui.page, s.content]}
        >
          {!items.length ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Icon name="cart-outline" size={50} color={p.primary} />
              </View>
              <Text style={ui.title}>السلة فارغة حالياً</Text>
              <Text style={[ui.caption, { textAlign: 'center' }]}>
                اختر المنتجات التي تريدها، وستظهر هنا لمراجعتها قبل إرسال الطلب.
              </Text>
              <Button
                title="تصفح المنتجات"
                onPress={() => navigation.navigate('ProductsScreen')}
                icon="arrow-left"
              />
            </View>
          ) : (
            <>
              <View>
                <Text style={ui.title}>راجع طلبك</Text>
                <Text style={ui.caption}>
                  {items.length} منتجات · يمكنك تعديل سعر البيع والكمية
                </Text>
              </View>
              {items.map((item) => (
                <Item key={item.cart_id} item={item} merchant={merchant} />
              ))}
              <Card style={{ backgroundColor: p.soft }}>
                <View style={ui.section}>
                  <Text style={s.name}>إجمالي المنتجات</Text>
                  <Text style={s.total}>{totalPrice.toFixed(2)} USD</Text>
                </View>
                <Text style={ui.caption}>تُعرض رسوم التوصيل في الخطوة التالية حسب المنطقة.</Text>
              </Card>
              <Button
                title="إتمام الطلب"
                icon="arrow-left"
                onPress={() => navigation.navigate('CheckoutScreen')}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  content: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  image: {
    width: 64,
    height: 72,
    resizeMode: 'contain',
    borderRadius: 12,
    backgroundColor: p.background,
  },
  name: { fontFamily: t.bold, fontSize: 16 },
  icon: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.soft,
    borderRadius: 12,
  },
  total: { fontFamily: t.bold, fontSize: 21, color: p.primary },
  empty: { paddingVertical: 64, gap: 18, alignItems: 'center' },
  emptyIcon: { padding: 24, borderRadius: 30, backgroundColor: p.soft },
});
