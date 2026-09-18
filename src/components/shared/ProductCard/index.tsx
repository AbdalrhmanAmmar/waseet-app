import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { useAppSelector } from '@/hooks/shared/use-store';
import { palette as p, typography as t } from '@/theme/tokens';
import Images from '@/theme/images';
import type { Product } from '@/types/models';
import { suggestedPrice } from '@/domain/product-details';
export default function ProductCard({
  item,
  onPress,
  onAddToCart,
  style,
}: {
  item: Product;
  index?: number;
  onPress: () => void;
  onAddToCart?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [brokenImage, setBrokenImage] = useState(false);
  const added = useAppSelector((state) =>
    state.cart.userCart.data.some((row) => String(row.productCode) === String(item.productCode)),
  );
  const out = item.stock <= 0;
  const price = item.effectiveExpectedSellPrice ?? item.price;
  return (
    <View style={[s.card, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`تفاصيل ${item.title}`}
        onPress={onPress}
      >
        <View style={s.imageBox}>
          <Image
            source={item.image && !brokenImage ? { uri: item.image } : Images.brandLogo}
            onError={() => setBrokenImage(true)}
            style={[s.image, (!item.image || brokenImage) && s.placeholder]}
            resizeMode="contain"
          />
          {out && (
            <View style={s.stockBadge}>
              <Text style={s.stockText}>نفدت الكمية</Text>
            </View>
          )}
        </View>
        <View style={s.info}>
          <Text style={s.category} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={s.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.label}>
            {suggestedPrice(item) != null ? 'سعر البيع المقترح' : 'سعر البيع'}
          </Text>
          <Text style={s.price}>
            {Number.isFinite(price) ? price.toLocaleString('en-US') : 'غير محدد'}{' '}
            <Text style={s.currency}>USD</Text>
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`إضافة ${item.title} للسلة`}
        accessibilityState={{ disabled: out }}
        disabled={out}
        onPress={onAddToCart}
        style={({ pressed }) => [
          s.add,
          added && { backgroundColor: p.primary },
          out && { opacity: 0.45 },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Icon name={added ? 'cart-check' : 'plus'} color={added ? '#fff' : p.primary} size={18} />
        <Text style={[s.addText, added && { color: '#fff' }]}>
          {added ? 'أضف المزيد' : 'إضافة للسلة'}
        </Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: p.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: p.border,
    overflow: 'hidden',
    padding: 10,
    gap: 12,
  },
  imageBox: {
    borderRadius: 13,
    backgroundColor: '#F2F5EF',
    aspectRatio: 1.18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '52%', height: '65%', opacity: 0.9 },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FFF4EF',
  },
  stockText: { color: p.danger, fontSize: 11 },
  info: { paddingTop: 10, gap: 3 },
  category: { fontSize: 11, color: p.muted },
  title: { fontFamily: t.bold, fontSize: 16, minHeight: 46, lineHeight: 23 },
  label: { color: p.muted, fontSize: 11 },
  price: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: t.bold,
    color: p.deep,
    writingDirection: 'ltr',
  },
  currency: { fontSize: 11, color: p.muted },
  add: {
    marginTop: 'auto',
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: p.soft,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addText: { color: p.primary, fontFamily: t.bold, fontSize: 13 },
});
