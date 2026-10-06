import { StyleSheet, View } from 'react-native';
import Text from '@/components/shared/CustomText';
import { catalogPalette as p } from '@/components/shared/catalog/catalog-theme';
import { formatMoney, optionalPrice } from '@/domain/product-details';
import type { Product } from '@/types/models';

export function SalesProductPrices({ product }: { product: Product }) {
  const expected = optionalPrice(product.expectedSellPrice);
  const effective = optionalPrice(product.effectiveExpectedSellPrice);
  const rows = [
    { label: 'السعر الأصلي', value: optionalPrice(product.originalPrice), primary: false },
    {
      label: 'سعر البيع المتوقع',
      value: expected,
      primary: effective == null || effective === expected,
    },
    ...(effective != null && effective !== expected
      ? [{ label: 'السعر المتوقع المطبق', value: effective, primary: true }]
      : []),
  ];
  return (
    <View style={s.prices}>
      {rows.map((row) => (
        <View key={row.label} style={[s.price, row.primary && s.active]}>
          <Text style={s.label}>{row.label}</Text>
          <Text style={[s.value, row.primary && s.primary]}>{formatMoney(row.value)}</Text>
        </View>
      ))}
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
