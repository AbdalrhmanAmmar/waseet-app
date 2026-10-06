import { orderEditDecision } from '@/domain/order-edit-policy';
import { actorFromUser } from '@/domain/internal-order-policy';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrderQuery, useUpdateOrderMutation } from '@/api/shared/orders';
import { useOrderDeliveryMode } from '@/hooks/shared/use-order-delivery-mode';
import { useSession } from '@/hooks/shared/use-session';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { useScreenProps, type ScreenProps } from '@/navigation/use-screen-props';
import {
  deliveryMode,
  orderVersion,
  validateOrderUpdate,
  mutationError,
} from '@/domain/order-workflow';
import { normalizeNumber } from '@/components/shared/catalog/catalog-model';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Header from '@/components/shared/HeaderComponent';
import Text from '@/components/shared/CustomText';
import { Button, Card, ui } from '@/components/shared/ui';
import { Field } from '@/components/shared/order-create/Field';
import { ChoiceSheet } from '@/components/shared/order-create/ChoiceSheet';
import { s } from '@/components/shared/order-create/styles';
import { AsyncState } from '@/components/shared/AsyncState';
import { DeliveryModeCard } from '@/components/shared/orders/DeliveryModeCard';
import type { Order, OrderInput } from '@/types/models';
import { formatMoney } from '@/domain/product-details';

type EditRow = {
  key: string;
  code: string;
  name: string;
  quantity: string;
  price: string;
  color: string;
};
const values = (order: Order) => ({
  customerName: order.customerName,
  customerMobile: order.customerMobile ?? '',
  secondCustomerPhone: order.secondCustomerPhone ?? '',
  customerArea: order.customerArea ?? '',
  customerAddress: order.customerAddress ?? '',
});
export default function EditOrderRoute() {
  const props = useScreenProps();
  const { can } = useSession();
  const id = props.route.params.orderId ?? props.route.params.id;
  const query = useOrderQuery(String(id ?? ''), {
    skip: !id || !can('orders.edit'),
    refetchOnMountOrArgChange: true,
  });
  if (!can('orders.edit'))
    return (
      <ScreenContainer>
        <Header title="تعديل الطلب" />
        <View style={ui.page}>
          <Text accessibilityRole="alert">تعديل بيانات الطلب متاح لموظف الإدارة فقط.</Text>
          <Button
            title="العودة إلى تفاصيل الطلب"
            onPress={() => props.navigation.replace('OrderDetails', { orderId: id })}
          />
        </View>
      </ScreenContainer>
    );
  if (query.currentData && String(query.currentData.orderId) === String(id))
    return (
      <OrderEditor
        key={String(id)}
        {...props}
        order={query.currentData}
        detailError={!!query.error}
        detailLoading={query.isFetching}
      />
    );
  return (
    <ScreenContainer>
      <Header title="تعديل الطلب" />
      <AsyncState
        loading={query.isLoading}
        error={query.error}
        empty={!query.isLoading && !query.error ? 'تعذر التحقق من الطلب' : undefined}
        onRetry={() => {
          if (!query.isUninitialized) void query.refetch();
        }}
      />
    </ScreenContainer>
  );
}
function OrderEditor({
  order,
  navigation,
  detailError,
  detailLoading,
}: ScreenProps & { order: Order; detailError: boolean; detailLoading: boolean }) {
  const { can, userData } = useSession();
  const mode = useOrderDeliveryMode(order);
  const [baseline] = useState(() => orderVersion(order));
  const [initial] = useState(() => values(order));
  const [form, setForm] = useState(initial);
  const [rows, setRows] = useState<EditRow[]>(() =>
    order.items.map((r, i) => ({
      key: `saved-${i}`,
      code: String(r.productCode ?? ''),
      name: String(r.productName ?? 'منتج'),
      quantity: String(r.quantity ?? ''),
      price: String(r.actualSellPriceUSD ?? ''),
      color: String(r.color ?? ''),
    })),
  );
  const [dirty, setDirty] = useState(false),
    [review, setReview] = useState(false),
    [saved, setSaved] = useState(false),
    [areaPicker, setAreaPicker] = useState(false);
  const [error, setError] = useState('');
  const [leave, setLeave] = useState<NavigationAction | null>(null);
  const [update, result] = useUpdateOrderMutation();
  const lock = useRef(false),
    serial = useRef(0);
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const decision = orderEditDecision(order, actorFromUser(userData), mode.mode);
  const allowed = can('orders.edit') && decision.allowed && !mode.isError;
  const pending = detailLoading || mode.isFetching;
  usePreventRemove(!saved && (dirty || result.isLoading), ({ data }) => {
    if (!lock.current) setLeave(data.action);
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty || saved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saved]);
  const input: OrderInput = {
    ...form,
    customerName: form.customerName.trim(),
    customerMobile: form.customerMobile.trim(),
    secondCustomerPhone: form.secondCustomerPhone.trim(),
    customerAddress: form.customerAddress.trim(),
    items: rows.map((r) => ({
      productCode: Number(normalizeNumber(r.code)),
      quantity: Number(normalizeNumber(r.quantity)),
      actualSellPriceUSD: Number(normalizeNumber(r.price)),
      color: r.color.trim(),
    })),
  };
  const total = input.items.reduce((sum, row) => sum + row.quantity * row.actualSellPriceUSD, 0);
  const change = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setError('');
  };
  const rowChange = (key: string, field: keyof EditRow, value: string) => {
    setRows((items) =>
      items.map((r) =>
        r.key === key ? { ...r, [field]: value, ...(field === 'code' ? { name: 'منتج' } : {}) } : r,
      ),
    );
    setDirty(true);
    setError('');
  };
  const check = () => {
    if (!allowed || pending || detailError)
      return 'تعذر تأكيد صلاحية تعديل الطلب. حدّث التفاصيل وجهة التوصيل.';
    if (deliveryMode(form.customerArea, mode.currentData ?? []) !== mode.mode)
      return 'اختر منطقة من نوع توصيل الطلب نفسه.';
    return validateOrderUpdate(input, mode.mode);
  };
  const submit = async () => {
    if (lock.current || !review) return;
    const invalid = check();
    if (invalid) {
      setError(invalid);
      return;
    }
    lock.current = true;
    setError('');
    try {
      await update({ orderId: order.orderId, input, expectedVersion: baseline }).unwrap();
      setSaved(true);
      setReview(false);
    } catch (e) {
      setError(mutationError(e));
    } finally {
      lock.current = false;
    }
  };
  if (saved)
    return (
      <ScreenContainer>
        <Header title="تم تحديث الطلب" showBack={false} />
        <View style={ui.page}>
          <Text style={ui.title}>تم حفظ تعديلات الطلب بنجاح</Text>
          <Button
            title="العودة إلى تفاصيل الطلب"
            onPress={() => {
              const state = nav.getState();
              if (state && state.index > 0 && state.routes[state.index - 1]?.name === 'order')
                navigation.goBack();
              else navigation.replace('OrderDetails', { orderId: order.orderId });
            }}
          />
        </View>
      </ScreenContainer>
    );
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <Header title={`تعديل الطلب #${order.orderId}`} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
          <DeliveryModeCard
            mode={mode.mode}
            loading={mode.isFetching}
            retry={() => void mode.refetch()}
          />
          {!allowed && !pending && (
            <Text accessibilityRole="alert" style={s.error}>
              {decision.reason}
            </Text>
          )}
          <View
            pointerEvents={!allowed || result.isLoading ? 'none' : 'auto'}
            style={{ gap: 16, opacity: allowed ? 1 : 0.55 }}
          >
            <Card>
              <Text style={ui.title}>بيانات العميل والتوصيل</Text>
              <Field
                label="اسم العميل *"
                value={form.customerName}
                onChangeText={(v) => change('customerName', v)}
              />
              <Field
                label="رقم هاتف العميل *"
                value={form.customerMobile}
                keyboardType="phone-pad"
                onChangeText={(v) => change('customerMobile', v)}
              />
              <Field
                label="رقم هاتف إضافي (اختياري)"
                value={form.secondCustomerPhone}
                onChangeText={(v) => change('secondCustomerPhone', v)}
              />
              <Text style={ui.caption}>منطقة التوصيل: {form.customerArea}</Text>
              <Text style={ui.caption}>يمكن اختيار منطقة من نوع التوصيل الحالي نفسه.</Text>
              <Button title="تغيير منطقة التوصيل" secondary onPress={() => setAreaPicker(true)} />
              <Field
                label="العنوان التفصيلي *"
                multiline
                value={form.customerAddress}
                onChangeText={(v) => change('customerAddress', v)}
              />
            </Card>
            <Card>
              <Text style={ui.title}>منتجات الطلب</Text>
              <Text style={ui.caption}>
                عدّل الكمية والسعر واللون. ستُحفظ قائمة المنتجات كاملة.
              </Text>
              {rows.map((row, i) => (
                <View key={row.key} style={s.item} testID={`edit-order-row-${i}`}>
                  <Text style={ui.title}>
                    {row.name} · {i + 1}
                  </Text>
                  <Field
                    label={`كود المنتج ${i + 1}`}
                    keyboardType="number-pad"
                    value={row.code}
                    onChangeText={(v) => rowChange(row.key, 'code', normalizeNumber(v))}
                  />
                  <Field
                    label={`كمية المنتج ${i + 1}`}
                    keyboardType="number-pad"
                    value={row.quantity}
                    onChangeText={(v) => rowChange(row.key, 'quantity', normalizeNumber(v))}
                  />
                  <Field
                    label={`سعر بيع المنتج ${i + 1}`}
                    keyboardType="decimal-pad"
                    value={row.price}
                    onChangeText={(v) => rowChange(row.key, 'price', normalizeNumber(v))}
                  />
                  <Field
                    label={`لون المنتج ${i + 1}`}
                    maxLength={50}
                    value={row.color}
                    onChangeText={(v) => rowChange(row.key, 'color', v)}
                  />
                  <Button
                    title={`حذف المنتج ${i + 1}`}
                    secondary
                    onPress={() => {
                      setRows((r) => r.filter((v) => v.key !== row.key));
                      setDirty(true);
                    }}
                  />
                </View>
              ))}
              <Button
                title="إضافة منتج"
                secondary
                icon="plus"
                onPress={() => {
                  setRows((r) => [
                    ...r,
                    {
                      key: `new-${++serial.current}`,
                      name: 'منتج جديد',
                      code: '',
                      quantity: '1',
                      price: '',
                      color: '',
                    },
                  ]);
                  setDirty(true);
                }}
              />
            </Card>
            <Card>
              <Text style={ui.title}>ملخص التعديل</Text>
              <Text>عدد المنتجات: {rows.length}</Text>
              <Text>
                إجمالي القطع:{' '}
                {input.items.reduce(
                  (sum, row) => sum + (Number.isFinite(row.quantity) ? row.quantity : 0),
                  0,
                )}
              </Text>
              <Text>إجمالي البيع: {formatMoney(Number.isFinite(total) ? total : null)}</Text>
              <Text style={ui.caption}>
                الإجمالي النهائي ورسوم التوصيل يعتمدان على نتيجة الخادم بعد الحفظ.
              </Text>
            </Card>
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <Button
            title="مراجعة التعديلات"
            disabled={!allowed || pending || result.isLoading || detailError}
            onPress={() => {
              const invalid = check();
              setError(invalid ?? '');
              if (!invalid) setReview(true);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      {areaPicker && (
        <ChoiceSheet
          title={mode.mode === 'external' ? 'مناطق التوصيل الخارجي' : 'مناطق التوصيل الداخلي'}
          loading={mode.isFetching}
          error={mode.error ? 'تعذر تحميل المناطق' : undefined}
          onRetry={() => void mode.refetch()}
          onClose={() => setAreaPicker(false)}
          choices={(mode.currentData ?? [])
            .filter((a) => a.isInternalDelivery === (mode.mode === 'internal'))
            .map((a) => ({
              key: String(a.deliveryAreaId),
              title: a.city,
              caption: mode.mode === 'external' ? 'توصيل خارجي' : 'توصيل داخلي',
            }))}
          onSelect={(key) => {
            const area = mode.currentData?.find((a) => String(a.deliveryAreaId) === key);
            if (area) change('customerArea', area.city);
            setAreaPicker(false);
          }}
        />
      )}
      {(review || leave) && (
        <Modal
          transparent
          animationType={reducedMotion ? 'none' : 'slide'}
          onRequestClose={() => {
            if (!result.isLoading) {
              setReview(false);
              setLeave(null);
            }
          }}
        >
          <View style={s.overlay}>
            <View
              style={[s.sheet, { maxHeight: '90%', paddingBottom: Math.max(insets.bottom, 20) }]}
              accessibilityViewIsModal
            >
              <Text style={ui.title}>{leave ? 'مغادرة التعديل؟' : 'مراجعة تعديلات الطلب'}</Text>
              {leave ? (
                <>
                  <Text>ستفقد التعديلات غير المحفوظة.</Text>
                  <Button title="متابعة التعديل" onPress={() => setLeave(null)} />
                  <Button
                    title="تجاهل التعديلات والمغادرة"
                    secondary
                    onPress={() => {
                      const action = leave;
                      setLeave(null);
                      if (action) nav.dispatch(action);
                    }}
                  />
                </>
              ) : (
                <>
                  <ScrollView contentContainerStyle={{ gap: 12 }}>
                    {(Object.keys(form) as (keyof typeof form)[]).map((key) => (
                      <View key={key} style={{ gap: 4 }}>
                        <Text style={ui.caption}>
                          {
                            {
                              customerName: 'اسم العميل',
                              customerMobile: 'رقم الهاتف',
                              secondCustomerPhone: 'الهاتف الإضافي',
                              customerArea: 'منطقة التوصيل',
                              customerAddress: 'العنوان',
                            }[key]
                          }
                        </Text>
                        {initial[key] !== form[key] && (
                          <Text style={ui.caption}>قبل: {initial[key] || 'غير محدد'}</Text>
                        )}
                        <Text>{form[key]}</Text>
                      </View>
                    ))}
                    <Text style={ui.title}>قائمة المنتجات بعد التعديل</Text>
                    {input.items.map((r, i) => (
                      <Text key={i}>
                        #{r.productCode} · {r.quantity} × {formatMoney(r.actualSellPriceUSD)} ·
                        اللون: {r.color}
                      </Text>
                    ))}
                    <Text>إجمالي البيع: {formatMoney(total)}</Text>
                    {!!error && (
                      <Text accessibilityRole="alert" style={s.error}>
                        {error}
                      </Text>
                    )}
                  </ScrollView>
                  <Button
                    title="تأكيد وحفظ التعديلات"
                    loading={result.isLoading}
                    disabled={result.isLoading}
                    onPress={() => void submit()}
                  />
                  <Button
                    title="متابعة التعديل"
                    secondary
                    disabled={result.isLoading}
                    onPress={() => {
                      setReview(false);
                      setError('');
                    }}
                  />
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
}
