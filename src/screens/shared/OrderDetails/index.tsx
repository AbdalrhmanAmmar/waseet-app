import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useOrderQuery, useOrderStatusesQuery } from '@/api/shared/orders';
import Text from '@/components/shared/CustomText';
import Header from '@/components/shared/HeaderComponent';
import ScreenContainer from '@/components/shared/ScreenContainer';
import { AsyncState } from '@/components/shared/AsyncState';
import { statusLabel } from '@/components/shared/orders/statuses';
import { Button, Card, ui } from '@/components/shared/ui';
import { DeliveryModeCard } from '@/components/shared/orders/DeliveryModeCard';
import { OrderActions } from '@/components/shared/orders/OrderActions';
import { OrderHistoryPanel, displayDate } from '@/components/shared/orders/OrderHistoryPanel';
import { OrderWaybill } from '@/components/shared/orders/OrderWaybill';
import { useOrderDeliveryMode } from '@/hooks/shared/use-order-delivery-mode';
import { useSession } from '@/hooks/shared/use-session';
import { terminalStatus, normalizeStatus } from '@/domain/order-workflow';
import { orderPhone } from '@/domain/order-workspace';
import { formatMoney, optionalPrice } from '@/domain/product-details';
import { palette as p, typography as t } from '@/theme/tokens';
import type { ScreenProps } from '@/navigation/use-screen-props';
import type { Order } from '@/types/models';
type Props = ScreenProps & { profit?: React.ComponentType<{ value?: number }> };
export default function OrderDetails(props: Props) {
  const id = props.route.params.orderId ?? props.route.params.id;
  const query = useOrderQuery(String(id ?? ''), { skip: !id, refetchOnMountOrArgChange: true });
  const order = query.currentData;
  return (
    <ScreenContainer>
      <Header title={id ? `طلب #${id}` : 'تفاصيل الطلب'} />
      <AsyncState
        loading={query.isLoading}
        error={query.error}
        empty={!id ? 'معرّف الطلب غير متوفر' : undefined}
        onRetry={() => {
          if (!query.isUninitialized) void query.refetch();
        }}
      />
      {order && String(order.orderId) === String(id) && (
        <DetailsContent
          {...props}
          order={order}
          refreshing={query.isFetching}
          stale={!!query.error}
          refresh={() => {
            if (!query.isUninitialized) void query.refetch();
          }}
        />
      )}
    </ScreenContainer>
  );
}
function DetailsContent({
  order,
  navigation,
  refreshing,
  stale,
  refresh,
  profit: Profit,
}: Props & { order: Order; refreshing: boolean; stale: boolean; refresh: () => void }) {
  const { role, can } = useSession();
  const mode = useOrderDeliveryMode(order.customerArea);
  const statuses = useOrderStatusesQuery();
  const [contactError, setContactError] = useState(''),
    [copied, setCopied] = useState(false);
  const terminal = terminalStatus(order.status, statuses.data);
  const canEdit =
    can('orders.edit') &&
    mode.mode === 'internal' &&
    !mode.isFetching &&
    !statuses.isFetching &&
    !statuses.error &&
    !!statuses.data?.some((d) => normalizeStatus(d.status) === normalizeStatus(order.status)) &&
    !terminal &&
    !stale &&
    !refreshing;
  const phone = orderPhone(order.customerMobile);
  const itemsTotal = order.items.reduce(
    (sum, i) =>
      sum +
      (i.quantity != null && i.actualSellPriceUSD != null
        ? Number(i.quantity) * Number(i.actualSellPriceUSD)
        : Number.NaN),
    0,
  );
  const pieces = order.items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const deliveryStatus =
    typeof order.deliveryStatus === 'string' && order.deliveryStatus.trim()
      ? order.deliveryStatus
      : null;
  return (
    <ScrollView
      contentContainerStyle={ui.page}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={s.hero}>
        <View style={ui.section}>
          <View style={s.status}>
            <Text style={ui.link}>{statusLabel(order.status)}</Text>
          </View>
          <Icon name="package-variant-closed" size={32} color={p.primary} />
        </View>
        <Text style={ui.caption}>{displayDate(order.createdAt)}</Text>
        <Text style={ui.caption}>إجمالي الطلب المسجل</Text>
        <Text style={s.amount}>{formatMoney(optionalPrice(order.orderTotalUSD))}</Text>
        <Text style={ui.caption}>عدد القطع: {Number.isFinite(pieces) ? pieces : 'غير متوفر'}</Text>
      </View>
      <DeliveryModeCard
        mode={mode.mode}
        loading={mode.isFetching}
        retry={() => void mode.refetch()}
      />
      <Card>
        <Text style={ui.title}>إجراءات الطلب</Text>
        <Button
          title="تعديل الطلب"
          icon="file-document-edit-outline"
          secondary
          disabled={!canEdit}
          onPress={() => navigation.navigate('EditOrder', { orderId: order.orderId })}
        />
        {!canEdit && (
          <Text style={ui.caption}>
            {terminal
              ? 'هذا الطلب في حالة نهائية'
              : 'التعديل متاح بعد التحقق من بيانات طلب داخلي غير نهائي.'}
          </Text>
        )}
        {statuses.error && (
          <Button title="إعادة تحميل الحالات" secondary onPress={() => void statuses.refetch()} />
        )}
        {can('orders.status') && (
          <OrderActions order={order} disabled={stale || refreshing || terminal} />
        )}
      </Card>
      <Card>
        <Text style={ui.title}>بيانات العميل</Text>
        <Text>العميل: {order.customerName}</Text>
        <Text selectable>الهاتف: {order.customerMobile || 'غير متوفر'}</Text>
        <Text>المنطقة: {order.customerArea || 'غير متوفرة'}</Text>
        <Text>العنوان: {order.customerAddress || 'غير متوفر'}</Text>
        <Button
          title="اتصال بالعميل"
          icon="phone-outline"
          secondary
          disabled={!phone}
          onPress={() => {
            setContactError('');
            if (phone) void Linking.openURL(phone).catch(() => setContactError('تعذر فتح الاتصال'));
          }}
        />
        <Button
          title={copied ? 'تم نسخ الرقم' : 'نسخ رقم الهاتف'}
          secondary
          disabled={!order.customerMobile}
          onPress={() => {
            setContactError('');
            void Clipboard.setStringAsync(order.customerMobile ?? '')
              .then(() => setCopied(true))
              .catch(() => setContactError('تعذر نسخ الرقم'));
          }}
        />
        {!!contactError && (
          <Text accessibilityRole="alert" style={{ color: p.danger }}>
            {contactError}
          </Text>
        )}
      </Card>
      <Card>
        <Text style={ui.title}>منتجات الطلب</Text>
        {order.items.map((item, i) => (
          <View style={s.item} key={`${item.productCode}-${i}`}>
            <Text style={s.itemName}>{String(item.productName ?? item.name ?? 'منتج')}</Text>
            <Text style={ui.caption}>
              #{String(item.productCode ?? '—')} · الكمية: {String(item.quantity ?? 'غير متوفر')}
            </Text>
            <Text style={ui.caption}>اللون: {String(item.color || 'غير محدد')}</Text>
            {role === 'Merchant' && (
              <Text>سعر التاجر: {formatMoney(optionalPrice(item.merchantSellPriceUSD))}</Text>
            )}
            <Text>سعر البيع: {formatMoney(optionalPrice(item.actualSellPriceUSD))}</Text>
            <Text style={ui.link}>
              إجمالي المنتج:{' '}
              {formatMoney(
                Number.isFinite(Number(item.quantity) * Number(item.actualSellPriceUSD)) &&
                  item.quantity != null &&
                  item.actualSellPriceUSD != null
                  ? Number(item.quantity) * Number(item.actualSellPriceUSD)
                  : null,
              )}
            </Text>
          </View>
        ))}
        {!order.items.length && <Text style={ui.caption}>لا توجد تفاصيل منتجات لهذا الطلب</Text>}
      </Card>
      <Card>
        <Text style={ui.title}>الملخص المالي</Text>
        <Text>قيمة المنتجات: {formatMoney(Number.isFinite(itemsTotal) ? itemsTotal : null)}</Text>
        <Text>رسوم التوصيل: {formatMoney(optionalPrice(order.deliveryFee))}</Text>
        {Profit && role === 'Merchant' && <Profit value={order.totalMerchantProfitUSD} />}
        <Text style={ui.title}>
          الإجمالي المسجل: {formatMoney(optionalPrice(order.orderTotalUSD))}
        </Text>
        <Text style={ui.caption}>
          الإجمالي المعتمد هو المسجل في الخادم، والأرباح ضمن قيمة المنتجات.
        </Text>
      </Card>
      <Card>
        <Text style={ui.title}>{mode.mode === 'external' ? 'حالة Olivery' : 'حالة التوصيل'}</Text>
        <Text>{deliveryStatus ? statusLabel(deliveryStatus) : 'لم تُسجّل بعد'}</Text>
        <Button title="تحديث حالة التوصيل" secondary disabled={refreshing} onPress={refresh} />
      </Card>
      <OrderHistoryPanel id={order.orderId} />
      <OrderWaybill order={order} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  hero: { backgroundColor: p.soft, padding: 24, borderRadius: 24, gap: 10 },
  status: { borderRadius: 16, padding: 8, backgroundColor: '#fff' },
  amount: { color: p.deep, fontSize: 30, lineHeight: 44, fontFamily: t.bold },
  item: { gap: 6, paddingVertical: 14, borderTopWidth: 1, borderColor: p.border },
  itemName: { fontFamily: t.bold, fontSize: 18 },
});
