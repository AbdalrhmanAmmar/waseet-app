import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { typography as t } from '@/theme/tokens';
import { catalogPalette as p } from './catalog-theme';
import type { Product } from '@/types/models';
import { salePrice } from './catalog-model';
import { suggestedPrice } from '@/domain/product-details';

const money = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CatalogProductCard({
  item,
  list,
  merchant,
  onPress,
  onCreateOrder,
}: {
  item: Product;
  list: boolean;
  merchant: boolean;
  onPress: () => void;
  onCreateOrder: () => void;
}) {
  const [failedUri, setFailedUri] = useState<string>();
  const { fontScale } = useWindowDimensions();
  const stacked = list && fontScale > 1.25;
  const knownStock = item.stockKnown !== false && Number.isFinite(item.stock);
  const out = !knownStock || item.stock <= 0;
  const price = salePrice(item);
  const validPrice = Number.isFinite(price) && price >= 0;
  const merchantPrice = item.merchantSellPrice;
  return (
    <View style={[s.card, list && s.list]} testID={`catalog-product-${item.productCode}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`تفاصيل ${item.title}`}
        onPress={onPress}
        style={({ pressed }) => [list && !stacked && s.listDetails, pressed && s.pressed]}
      >
        <View style={[s.photo, list && !stacked && s.listPhoto]}>
          {item.image && failedUri !== item.image ? (
            <Image
              source={{ uri: item.image }}
              onError={() => setFailedUri(item.image)}
              style={s.image}
              resizeMode="contain"
            />
          ) : (
            <View style={s.fallback}>
              <Icon name="image-outline" size={34} color="#A79F92" />
              <Text style={s.fallbackText}>الصورة غير متاحة</Text>
            </View>
          )}
        </View>
        <View style={[s.info, list && !stacked && s.listInfo]}>
          {!!item.category && item.categoryProvided !== false && (
            <Text style={s.category} numberOfLines={1}>
              {item.category}
            </Text>
          )}
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
            {validPrice ? money(price) : '—'} <Text style={s.currency}>USD</Text>
          </Text>
          {merchant &&
            merchantPrice != null &&
            Number.isFinite(merchantPrice) &&
            merchantPrice >= 0 && (
              <View style={s.merchant}>
                <Text style={s.merchantLabel}>سعر التاجر</Text>
                <Text style={s.merchantPrice}>{money(merchantPrice)} USD</Text>
              </View>
            )}
        </View>
      </Pressable>
      <View style={s.action}>
        <View style={s.stockRow}>
          <View style={[s.stockDot, out && s.outDot]} />
          <Text style={[s.stock, out && s.outText]}>
            {!knownStock
              ? 'التوفر غير محدد'
              : out
                ? 'نفدت الكمية'
                : `متاح ${item.stock.toLocaleString('en-US')} قطعة`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`إنشاء طلب ${item.title}`}
          disabled={out}
          onPress={onCreateOrder}
          style={({ pressed }) => [s.add, out && s.unavailable, pressed && s.pressed]}
        >
          <Icon name="file-document-plus-outline" size={21} color={out ? p.muted : p.deep} />
          <Text style={[s.addText, out && s.disabledText]}>إنشاء طلب</Text>
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 5,
    borderWidth: 1,
    borderColor: p.border,
  },
  list: { width: '100%', padding: 10 },
  listTitle: { minHeight: 0 },
  listDetails: { flexDirection: 'row-reverse', gap: 14, alignItems: 'center' },
  photo: { aspectRatio: 1, backgroundColor: p.photo, borderRadius: 13, overflow: 'hidden' },
  listPhoto: { width: '34%', aspectRatio: 0.85 },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 7, padding: 6 },
  fallbackText: { fontSize: 11, color: p.muted, textAlign: 'center' },
  info: { paddingHorizontal: 5, paddingTop: 8 },
  listInfo: { flex: 1, minWidth: 0, paddingTop: 0 },
  category: { fontSize: 11, color: p.champagne, lineHeight: 19 },
  title: { fontFamily: t.bold, fontSize: 15, lineHeight: 22, minHeight: 44, color: p.deep },
  code: { fontSize: 11, color: p.muted, lineHeight: 19, writingDirection: 'ltr' },
  caption: { fontSize: 11, color: p.muted, lineHeight: 20, marginTop: 8 },
  price: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: t.bold,
    color: p.deep,
    writingDirection: 'ltr',
  },
  currency: { fontSize: 12 },
  merchant: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 4,
    marginTop: 2,
  },
  merchantLabel: { color: p.muted, fontSize: 11, lineHeight: 20 },
  merchantPrice: {
    color: p.ink,
    fontFamily: t.medium,
    fontSize: 11,
    lineHeight: 20,
    writingDirection: 'ltr',
  },
  action: { marginTop: 'auto', padding: 5, paddingTop: 8, gap: 8 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stockDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: p.primary },
  outDot: { backgroundColor: '#A48670' },
  stock: { fontSize: 11, lineHeight: 20, color: p.muted, flexShrink: 1 },
  outText: { color: '#8A6249' },
  add: {
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: p.soft,
    borderWidth: 1,
    borderColor: p.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  addText: { fontFamily: t.bold, color: p.deep, fontSize: 12, flexShrink: 1 },
  unavailable: { backgroundColor: '#F2F1EE', borderColor: p.border },
  disabledText: { color: p.muted },
  pressed: { opacity: 0.65 },
});
