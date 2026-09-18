import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { useAppDispatch, useAppSelector } from '@/hooks/shared/use-store';
import { addToCartLocal, removeFromCartLocal, updateCartQuantityLocal } from '@/store/slices/cart';
import { palette as p, typography as t } from '@/theme/tokens';
import type { Product } from '@/types/models';
import { salePrice } from './catalog-model';
import { suggestedPrice } from '@/domain/product-details';

export function CatalogProductCard({
  item,
  list,
  merchant,
  onPress,
}: {
  item: Product;
  list: boolean;
  merchant: boolean;
  onPress: () => void;
}) {
  const [failedUri, setFailedUri] = useState<string>();
  const { width, fontScale } = useWindowDimensions();
  const inline = list && width >= 380 && fontScale <= 1.25;
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) =>
    state.cart.userCart.data.find((row) => String(row.productCode) === String(item.productCode)),
  );
  const out = !Number.isFinite(item.stock) || item.stock <= 0;
  const price = salePrice(item);
  const validPrice = Number.isFinite(price) && price >= 0;
  const add = () => {
    if (!out && validPrice) dispatch(addToCartLocal(item));
  };
  const minus = () => {
    if (!cart) return;
    if (cart.quantity <= 1) dispatch(removeFromCartLocal(cart.cart_id));
    else dispatch(updateCartQuantityLocal({ cart_id: cart.cart_id, quantity: cart.quantity - 1 }));
  };
  return (
    <View
      style={[s.card, list && s.list, inline && s.inline]}
      testID={`catalog-product-${item.productCode}`}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`تفاصيل ${item.title}`}
        onPress={onPress}
        style={[list && s.listDetails, inline && s.inlineDetails]}
      >
        <View style={[s.photo, list && s.listPhoto, inline && s.inlinePhoto]}>
          {item.image && failedUri !== item.image ? (
            <Image
              source={{ uri: item.image }}
              onError={() => setFailedUri(item.image)}
              style={s.image}
              resizeMode="contain"
            />
          ) : (
            <View style={s.fallback}>
              <Icon name="image-outline" size={32} color="#A2B7AB" />
              <Text style={s.fallbackText}>الصورة غير متاحة</Text>
            </View>
          )}
          <View style={[s.badge, out && s.outBadge]}>
            <Text style={[s.badgeText, out && s.outText]}>{out ? 'نفدت الكمية' : 'متوفر'}</Text>
          </View>
        </View>
        <View style={[s.info, list && s.listInfo]}>
          <Text style={s.category} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={[s.title, list && s.listTitle]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.code} numberOfLines={1}>
            {String(item.productCode)}
          </Text>
          <Text style={s.caption}>
            {suggestedPrice(item) != null ? 'سعر البيع المقترح' : 'سعر البيع'}
          </Text>
          <Text style={s.price}>
            {validPrice ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}{' '}
            <Text style={s.currency}>USD</Text>
          </Text>
          {merchant &&
            item.merchantSellPrice != null &&
            Number.isFinite(Number(item.merchantSellPrice)) && (
              <View style={s.merchant}>
                <Text style={s.merchantLabel}>سعر التاجر</Text>
                <Text style={s.merchantPrice}>
                  {Number(item.merchantSellPrice).toLocaleString('en-US')} USD
                </Text>
              </View>
            )}
        </View>
      </Pressable>
      <View style={inline ? s.inlineAction : list ? s.listAction : s.action}>
        {cart ? (
          <View style={s.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`تقليل كمية ${item.title}`}
              onPress={minus}
              style={s.step}
            >
              <Icon name="minus" size={20} color={p.primary} />
            </Pressable>
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={`الكمية ${cart.quantity}`}
              style={s.quantity}
            >
              {cart.quantity}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`زيادة كمية ${item.title}`}
              accessibilityState={{ disabled: out || cart.quantity >= item.stock }}
              disabled={out || cart.quantity >= item.stock}
              onPress={add}
              style={[s.step, (out || cart.quantity >= item.stock) && s.disabled]}
            >
              <Icon name="plus" size={20} color={p.primary} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`إضافة ${item.title} للسلة`}
            accessibilityState={{ disabled: out || !validPrice }}
            disabled={out || !validPrice}
            onPress={add}
            style={({ pressed }) => [
              s.add,
              (out || !validPrice) && s.unavailable,
              pressed && s.disabled,
            ]}
          >
            {!out && validPrice && <Icon name="plus" size={19} color="#fff" />}
            <Text style={[s.addText, (out || !validPrice) && s.outText]}>
              {out ? 'غير متوفر' : !validPrice ? 'السعر غير متاح' : 'إضافة للسلة'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 19,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E7EDE7',
    gap: 8,
  },
  list: { width: '100%', padding: 12 },
  inline: { flexDirection: 'row-reverse', alignItems: 'center' },
  inlineDetails: { flex: 1, gap: 8 },
  inlinePhoto: { width: 65, aspectRatio: 0.65 },
  inlineAction: { width: 108 },
  listTitle: { minHeight: 0 },
  listDetails: { flexDirection: 'row-reverse', gap: 14, alignItems: 'center' },
  photo: { aspectRatio: 1.14, backgroundColor: '#F2F3EF', borderRadius: 13, overflow: 'hidden' },
  listPhoto: { width: '32%', aspectRatio: 0.9 },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 3 },
  fallbackText: { fontSize: 10, color: p.muted },
  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: '#D6F4E0',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeText: { color: '#146449', fontSize: 10, lineHeight: 20, fontFamily: t.bold },
  outBadge: { backgroundColor: '#FAE7DF' },
  outText: { color: '#8B5141' },
  info: { paddingHorizontal: 3, paddingTop: 7 },
  listInfo: { flex: 1, paddingTop: 0 },
  category: { fontSize: 10, color: p.muted, lineHeight: 18 },
  title: { fontFamily: t.bold, fontSize: 15, lineHeight: 22, minHeight: 44, color: p.deep },
  code: { fontSize: 11, color: p.muted, lineHeight: 18 },
  caption: { fontSize: 10, color: p.muted, lineHeight: 18, marginTop: 3 },
  price: {
    fontSize: 21,
    lineHeight: 28,
    fontFamily: t.bold,
    color: p.deep,
    writingDirection: 'ltr',
  },
  currency: { fontSize: 11 },
  merchant: {
    backgroundColor: p.soft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
  },
  merchantLabel: { color: p.primary, fontSize: 10, lineHeight: 16 },
  merchantPrice: { color: p.primary, fontFamily: t.bold, fontSize: 13, lineHeight: 20 },
  action: { marginTop: 'auto' },
  listAction: { alignSelf: 'flex-start', minWidth: 144 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF5EF',
    borderRadius: 10,
  },
  step: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quantity: { fontSize: 16, fontFamily: t.bold, color: p.deep },
  add: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: p.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  addText: { fontFamily: t.bold, color: '#fff', fontSize: 12 },
  unavailable: { backgroundColor: '#EEF0EC' },
  disabled: { opacity: 0.4 },
});
