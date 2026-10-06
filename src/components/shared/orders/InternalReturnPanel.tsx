import { View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { Card, Button, ui } from '../ui';
import { useSession } from '@/hooks/shared/use-session';
import { useScreenProps } from '@/navigation/use-screen-props';
import { actorFromUser } from '@/domain/internal-order-policy';
import { internalReturnDecision } from '@/domain/internal-return';
import { normalizeStatus, type DeliveryMode } from '@/domain/order-workflow';
import { formatMoney, optionalPrice } from '@/domain/product-details';
import { palette as p } from '@/theme/tokens';
import { useInternalReturnReceiptQuery } from '@/api/shared/internal-returns';
import type { Order } from '@/types/models';
const stages = [
  ['processing', 'قيد المعالجة'],
  ['confirmed', 'مؤكد'],
  ['returnedinprogress', 'جاري نقل المرتجع'],
  ['returneddelivered', 'تم تسليم المرتجع'],
  ['completedreturned', 'تم إتمام الإرجاع'],
];
export function ReturnSettlement({ order }: { order: Order }) {
  const { role } = useSession();
  const finalized =
    order.isReturnFinalized === true || normalizeStatus(order.status) === 'completedreturned';
  const line = (label: string, value: unknown) => {
    const amount = optionalPrice(value);
    return (
      <Text>
        {label}:{' '}
        {amount === null
          ? 'غير متوفر'
          : `${formatMoney(Math.abs(amount))} · ${amount > 0 ? 'خصم من الرصيد' : amount < 0 ? 'إضافة للرصيد' : 'دون تغيير'}`}
      </Text>
    );
  };
  return (
    <Card>
      <Text style={ui.title}>{finalized ? 'التسوية المسجلة' : 'التسوية عند الإكمال'}</Text>
      {order.items.map((item, index) => (
        <Text key={String(item.orderItemId ?? index)}>
          {String(item.productName ?? 'منتج')} · {String(item.quantity)} قطعة · سعر الإرجاع{' '}
          {formatMoney(optionalPrice(item.actualSellPriceUSD))}
        </Text>
      ))}
      {role === 'ManagementEmployee' && line('تسوية الإدارة', order.totalAdminProfitUSD)}
      {(role === 'ManagementEmployee' || role === 'Merchant') &&
        line('تسوية التاجر', order.totalMerchantProfitUSD)}
      <Text style={ui.caption}>
        {finalized
          ? 'الطلب مكتمل؛ لا يمكن تكرار التسوية.'
          : 'تُعاد الكميات للمخزون وتُطبق التسوية مرة واحدة عند إكمال المرتجع. القيم المعروضة محفوظة بالخادم؛ لا يُعاد حسابها من أسعار المنتجات الحالية.'}
      </Text>
      <Text style={ui.caption}>
        القيمة غير المتوفرة لا تعني صفرًا. قيمة الإرجاع لا تؤكد إجراء تحويل مالي للعميل.
      </Text>
    </Card>
  );
}
export function InternalReturnPanel({
  order,
  mode,
  disabled,
  refresh,
}: {
  order: Order;
  mode: DeliveryMode;
  disabled: boolean;
  refresh: () => void;
}) {
  const { userData, role } = useSession();
  const { navigation } = useScreenProps();
  const receipt = useInternalReturnReceiptQuery({
    orderId: order.orderId,
    userId: userData?.userId ?? '',
    role: role ?? '',
  });
  const returning = String(order.orderType).toLowerCase() === 'return';
  const decision = internalReturnDecision(order, mode, actorFromUser(userData));
  if (returning && mode === 'internal') {
    const current = stages.findIndex(([value]) => value === normalizeStatus(order.status));
    const original = Number(order.originalOrderId);
    return (
      <>
        <Card style={{ backgroundColor: p.soft }}>
          <Text style={ui.title}>مرتجع داخلي</Text>
          <Text style={ui.caption}>
            طلب مستقل مرتبط بالبيع الأصلي · المنطقة: {order.customerArea || 'غير متوفرة'}
          </Text>
          {Number.isSafeInteger(original) &&
            original > 0 &&
            String(original) !== String(order.orderId) && (
              <Button
                title={`عرض الطلب الأصلي #${original}`}
                secondary
                onPress={() => navigation.push('OrderDetails', { orderId: original })}
              />
            )}
          {stages.map(([value, label], index) => (
            <View key={value} style={[ui.section, { justifyContent: 'flex-start' }]}>
              <Icon
                name={index <= current ? 'check-circle' : 'circle-outline'}
                color={index <= current ? p.primary : p.muted}
                size={22}
              />
              <Text style={index === current ? ui.link : ui.caption}>{label}</Text>
            </View>
          ))}
          <Text style={ui.caption}>تظهر الإجراءات حسب دورك ومرحلة المرتجع.</Text>
        </Card>
        <ReturnSettlement order={order} />
      </>
    );
  }
  if (role !== 'ManagementEmployee' || mode === 'external') return null;
  return (
    <Card>
      <Text style={ui.title}>المرتجع الداخلي</Text>
      <Text style={ui.caption}>
        {receipt.currentData?.state === 'saved'
          ? 'تم تسجيل مرتجع لهذا الطلب.'
          : receipt.currentData?.state === 'uncertain'
            ? 'يوجد إنشاء سابق يحتاج التحقق من نتيجته.'
            : disabled
              ? 'جارٍ التحقق من بيانات الطلب. إذا تعذر الاتصال، حدّث البيانات للمحاولة مجددًا.'
              : decision.reason}
      </Text>
      {(!decision.allowed || disabled) && (
        <Button title="تحديث بيانات أهلية المرتجع" secondary onPress={refresh} />
      )}
      <Button
        title={receipt.currentData ? 'متابعة المرتجع' : 'إنشاء مرتجع داخلي'}
        icon="package-variant-closed"
        secondary
        disabled={disabled || (!receipt.currentData && !decision.allowed)}
        onPress={() => navigation.navigate('CreateInternalReturn', { orderId: order.orderId })}
      />
    </Card>
  );
}
