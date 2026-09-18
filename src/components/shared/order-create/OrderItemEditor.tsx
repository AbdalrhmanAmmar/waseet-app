import { Image, Pressable, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { Field } from './Field';
import { s } from './styles';
import { lineTotal, type DraftItem, type DraftErrors } from '@/domain/order-draft';
import { normalizeNumber } from '../catalog/catalog-model';
import { formatMoney } from '@/domain/product-details';
import { palette as p } from '@/theme/tokens';
export function OrderItemEditor({
  row,
  errors,
  merchant,
  disabled,
  onChange,
  onRemove,
}: {
  row: DraftItem;
  errors: DraftErrors;
  merchant: boolean;
  disabled?: boolean;
  onChange: (patch: Partial<DraftItem>) => void;
  onRemove: () => void;
}) {
  const prefix = `items.${row.key}`;
  const qty = Number(normalizeNumber(row.quantity));
  const difference =
    row.product.merchantSellPrice == null || !row.price.trim()
      ? null
      : Number(normalizeNumber(row.price)) - row.product.merchantSellPrice;
  return (
    <View style={s.item} testID={`order-item-${row.key}`}>
      <View style={s.row}>
        <View style={[s.section, { flex: 1 }]}>
          {row.product.image ? (
            <Image source={{ uri: row.product.image }} style={s.photo} />
          ) : (
            <Icon name="package-variant" size={30} color={p.primary} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.itemName}>{row.product.title}</Text>
            <Text style={s.caption}>
              #{row.product.productCode} · متاح {row.product.stock} قطعة
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`حذف ${row.product.title}`}
          disabled={disabled}
          onPress={onRemove}
          style={s.icon}
        >
          <Icon name="trash-can-outline" size={22} color={p.danger} />
        </Pressable>
      </View>
      {!!errors[`${prefix}.product`] && (
        <Text accessibilityRole="alert" style={s.error}>
          {errors[`${prefix}.product`]}
        </Text>
      )}
      <View style={s.qty}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`زيادة كمية ${row.product.title}`}
          disabled={disabled || !Number.isFinite(qty) || qty >= row.product.stock}
          onPress={() => onChange({ quantity: String(qty + 1) })}
          style={s.icon}
        >
          <Icon name="plus" size={22} color={p.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Field
            editable={!disabled}
            label={`كمية ${row.product.title}`}
            keyboardType="number-pad"
            value={row.quantity}
            onChangeText={(quantity) => onChange({ quantity: normalizeNumber(quantity) })}
            error={errors[`${prefix}.quantity`]}
            style={s.qtyInput}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`تقليل كمية ${row.product.title}`}
          disabled={disabled || !Number.isFinite(qty) || qty <= 1}
          onPress={() => onChange({ quantity: String(qty - 1) })}
          style={s.icon}
        >
          <Icon name="minus" size={22} color={p.primary} />
        </Pressable>
      </View>
      <Field
        editable={!disabled}
        label={`سعر بيع ${row.product.title} (USD)`}
        keyboardType="decimal-pad"
        value={row.price}
        onChangeText={(price) => onChange({ price: normalizeNumber(price) })}
        error={errors[`${prefix}.price`]}
      />
      {merchant && difference != null && Number.isFinite(difference) && (
        <Text style={s.caption}>
          {difference < 0 ? 'أقل من سعر التاجر بـ' : 'فرق السعر المتوقع للقطعة:'}{' '}
          {formatMoney(Math.abs(difference))}
        </Text>
      )}
      <Field
        editable={!disabled}
        label={`لون ${row.product.title} *`}
        placeholder="مثال: أسود"
        value={row.color}
        maxLength={50}
        onChangeText={(color) => onChange({ color })}
        error={errors[`${prefix}.color`]}
      />
      <View style={s.row}>
        <Text style={s.caption}>إجمالي المنتج</Text>
        <Text style={s.money}>{formatMoney(lineTotal(row))}</Text>
      </View>
    </View>
  );
}
