import { StyleSheet, View } from 'react-native';
import Text from '@/components/shared/CustomText';
import { catalogPalette as p } from '@/components/shared/catalog/catalog-theme';
import { formatMoney, optionalPrice } from '@/domain/product-details';
import type { Product } from '@/types/models';

// Sales sees one price only: the expected sell price.
export function SalesProductPrices({ product }: { product: Product }) {
  return (
    <View style={s.prices}>
      <View style={[s.price, s.active]}>
        <Text style={s.label}>سعر البيع المتوقع</Text>
        <Text style={[s.value, s.primary]}>
          {formatMoney(optionalPrice(product.expectedSellPrice))}
        </Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  prices: { gap: 8 },
  price: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: p.background,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  active: { backgroundColor: p.soft },
  label: { color: p.muted, fontSize: 12, lineHeight: 22, textAlign: 'right' },
  value: { color: p.ink, fontSize: 15, fontWeight: '700', writingDirection: 'ltr' },
  primary: { color: p.primary },
});
