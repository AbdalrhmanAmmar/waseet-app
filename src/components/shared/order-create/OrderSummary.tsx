import { normalizeNumber } from '../catalog/catalog-model';
import { View } from 'react-native';
import Text from '../CustomText';
import { s } from './styles';
import { orderSubtotal, type OrderDraft } from '@/domain/order-draft';
import { formatMoney } from '@/domain/product-details';
export function OrderSummary({ draft, fee }: { draft: OrderDraft; fee: number | null }) {
  const subtotal = orderSubtotal(draft);
  return (
    <View style={s.card}>
      <Text style={s.subtitle}>ملخص الطلب</Text>
      {[
        ['عدد المنتجات', String(draft.items.length)],
        [
          'عدد القطع',
          String(
            draft.items.reduce((sum, row) => {
              const quantity = Number(normalizeNumber(row.quantity));
              return sum + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0);
            }, 0),
          ),
        ],
        ['قيمة المنتجات', formatMoney(subtotal)],
        ['رسوم التوصيل', fee == null ? 'اختر منطقة برسوم متاحة' : formatMoney(fee)],
        [
          'الإجمالي المتوقع',
          formatMoney(fee == null ? null : Math.round((subtotal + fee) * 100) / 100),
        ],
      ].map(([label, value]) => (
        <View style={s.row} key={label}>
          <Text style={s.caption}>{label}</Text>
          <Text style={s.money}>{value}</Text>
        </View>
      ))}
      <Text style={s.caption}>القيمة تقديرية؛ المبلغ النهائي هو المسجل من الخادم.</Text>
    </View>
  );
}
