import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { catalogPalette as p } from '@/components/shared/catalog/catalog-theme';
import type { Product } from '@/types/models';
import { SalesProductPrices } from './SalesProductPrices';

export function SalesProductCard({
  product,
  onCreate,
}: {
  product: Product;
  onCreate: () => void;
}) {
  return (
    <View style={s.card} testID={`sales-product-${product.productCode}`}>
      <View style={s.header}>
        <View style={s.icon}>
          <Icon name="package-variant-closed" size={25} color={p.primary} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.name}>{product.name}</Text>
          <Text style={s.code}>كود المنتج · {`\u200E#${product.productCode}`}</Text>
        </View>
      </View>
      <SalesProductPrices product={product} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`إنشاء طلب ${product.name}`}
        onPress={onCreate}
        style={({ pressed }) => [s.button, pressed && { opacity: 0.8 }]}
      >
        <Icon name="plus" size={20} color={p.primary} />
        <Text style={s.buttonText}>إنشاء طلب</Text>
        <Icon name="arrow-left" size={18} color={p.primary} />
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: p.border,
    padding: 18,
    gap: 16,
  },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: p.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: p.deep, fontSize: 18, fontWeight: '700', lineHeight: 28, textAlign: 'right' },
  code: { color: p.muted, fontSize: 12, lineHeight: 21, textAlign: 'right' },
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderColor: '#BCD2C8',
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
  },
  buttonText: { color: p.primary, fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right' },
});
