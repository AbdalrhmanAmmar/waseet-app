import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useOrderQuery } from '@/api/shared/orders';
import {
  useExternalReturnReceiptQuery,
  useProcessExternalReturnMutation,
  useRefreshExternalOrderMutation,
} from '@/api/shared/external-orders';
import { useSession } from '@/hooks/shared/use-session';
import { useScreenProps } from '@/navigation/use-screen-props';
import { actorFromUser } from '@/domain/internal-order-policy';
import { resolveDeliveryMode } from '@/domain/order-delivery-list';
import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import {
  externalReturnReason,
  externalReturnSnapshot,
  returnProcessed,
  validateExternalReturn,
  type ExternalReturnInput,
} from '@/domain/external-order-policy';
import { externalReturnSummary } from '@/domain/external-return-summary';
import { mutationError } from '@/domain/order-workflow';
import { formatMoney } from '@/domain/product-details';
import { normalizeNumber } from '@/components/shared/catalog/catalog-model';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Header from '@/components/shared/HeaderComponent';
import Text from '@/components/shared/CustomText';
import { AsyncState } from '@/components/shared/AsyncState';
import { Button, Card, ui } from '@/components/shared/ui';
import { Field } from '@/components/shared/order-create/Field';
import { OrderStatusSummary } from '@/components/shared/orders/OrderStatusSummary';
import { palette as p } from '@/theme/tokens';
import type { Order } from '@/types/models';
export default function ProcessExternalReturn() {
  const { route } = useScreenProps(),
    { role } = useSession();
  const id = String(route.params.orderId ?? '');
  const query = useOrderQuery(id, {
    skip: !id || role !== 'ManagementEmployee',
    refetchOnMountOrArgChange: true,
  });
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <Header title="معالجة المرتجع الخارجي" />
      {role !== 'ManagementEmployee' ? (
        <View style={ui.page}>
          <Text>معالجة المرتجع متاحة للإداري فقط.</Text>
        </View>
      ) : (
        <>
          <AsyncState
            loading={query.isLoading}
            error={query.error}
            empty={!id ? 'معرف الطلب غير متوفر' : undefined}
            onRetry={() => {
              if (id) void query.refetch();
            }}
          />
          {query.currentData && (
            <ReturnForm key={id} order={query.currentData} stale={!!query.error} />
          )}
        </>
      )}
    </ScreenContainer>
  );
}
function ReturnForm({ order, stale }: { order: Order; stale: boolean }) {
  const { userData } = useSession(),
    { navigation } = useScreenProps(),
    nav = useNavigation();
  const areas = useDeliveryAreasQuery();
  const [refresh, checking] = useRefreshExternalOrderMutation();
  const [process, result] = useProcessExternalReturnMutation();
  const receipt = useExternalReturnReceiptQuery({
    orderId: order.orderId,
    userId: userData?.userId ?? '',
    role: userData?.role ?? '',
  });
  const [verified, setVerified] = useState<Order | null>(null),
    [error, setError] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [review, setReview] = useState(false),
    [snapshot, setSnapshot] = useState('');
  const [leave, setLeave] = useState<NavigationAction | null>(null);
  const lock = useRef(false),
    started = useRef(false),
    scroll = useRef<ScrollView>(null);
  const current = verified ?? order;
  const saved =
    result.data?.state === 'saved' ||
    receipt.currentData?.state === 'saved' ||
    returnProcessed(order) ||
    returnProcessed(current);
  const uncertain = receipt.currentData?.state === 'uncertain';
  const dirty = Object.keys(quantities).length > 0;
  const busy = checking.isLoading || result.isLoading;
  const verify = async () => {
    if (lock.current) return;
    lock.current = true;
    setError('');
    setReview(false);
    setVerified(null);
    try {
      const fresh = await refresh({ orderId: order.orderId, sync: true }).unwrap();
      setVerified(fresh);
    } catch (e) {
      setError(mutationError(e));
    } finally {
      lock.current = false;
    }
  };
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void verify();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [review, saved]);
  usePreventRemove(!saved && (dirty || busy), ({ data }) => {
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
  const input: ExternalReturnInput = {
    items: Object.entries(quantities).map(([id, q]) => ({
      orderItemId: Number(id),
      quantity: Number(normalizeNumber(q)),
    })),
  };
  const reason = externalReturnReason(
    current,
    actorFromUser(userData),
    resolveDeliveryMode(current, areas.currentData ?? []),
  );
  const summary = externalReturnSummary(current, input);
  const submit = async () => {
    if (lock.current || busy || saved || uncertain || !verified) return;
    const invalid = reason || validateExternalReturn(current, input);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError('');
    if (!review) {
      setSnapshot(externalReturnSnapshot(current));
      setReview(true);
      return;
    }
    lock.current = true;
    try {
      await process({ orderId: order.orderId, input, expectedSnapshot: snapshot }).unwrap();
    } catch (e) {
      setError(mutationError(e));
      setReview(false);
      setVerified(null);
    } finally {
      lock.current = false;
    }
  };
  const amount = (value: number | null) =>
    value === null
      ? 'غير متاح'
      : `${formatMoney(Math.abs(value))} · ${value > 0 ? 'خصم متوقع' : value < 0 ? 'إضافة متوقعة' : 'دون تغيير'}`;
  const blocked =
    busy ||
    stale ||
    !verified ||
    !!reason ||
    receipt.isFetching ||
    !!receipt.error ||
    saved ||
    !!uncertain;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
        <Card style={{ backgroundColor: p.soft }}>
          <Icon
            name={saved ? 'check-circle-outline' : 'package-variant-closed'}
            size={36}
            color={p.primary}
          />
          <Text style={ui.title}>
            {saved
              ? 'تم تسجيل المرتجع الخارجي'
              : review
                ? 'راجع الكميات قبل التأكيد'
                : 'حدد ما عاد فعليًا'}
          </Text>
          <Text style={ui.caption}>
            طلب #{order.orderId} · {order.customerName}
          </Text>
          <Text style={ui.caption}>
            تُسجّل الكميات على الطلب الأصلي مرة واحدة، دون إنشاء طلب جديد أو تغيير حالته.
          </Text>
        </Card>
        <OrderStatusSummary order={current} mode="external" showMode={false} />
        {saved ? (
          <Card>
            <Text>تم تسجيل مرتجع لهذا الطلب.</Text>
            {(
              result.data?.items ??
              receipt.currentData?.items ??
              current.items
                .filter((i) => Number(i.returnedQuantity) > 0)
                .map((i) => ({
                  orderItemId: Number(i.orderItemId),
                  quantity: Number(i.returnedQuantity),
                }))
            ).map((row) => (
              <View key={row.orderItemId}>
                <Text>
                  {String(
                    current.items.find((i) => Number(i.orderItemId) === row.orderItemId)
                      ?.productName ?? `بند #${row.orderItemId}`,
                  )}
                </Text>
                <Text>الكمية المرتجعة: {row.quantity}</Text>
              </View>
            ))}
            <Button
              title="العودة إلى تفاصيل الطلب"
              onPress={() => navigation.replace('OrderDetails', { orderId: order.orderId })}
            />
          </Card>
        ) : (
          <>
            <Card>
              <Text style={ui.title}>
                {checking.isLoading
                  ? 'جارٍ التحقق من زحل'
                  : verified
                    ? 'تم تحديث بيانات زحل'
                    : 'يلزم تحديث حالة زحل'}
              </Text>
              <Text style={ui.caption}>
                {uncertain
                  ? 'نتيجة المحاولة السابقة غير مؤكدة؛ لن نكرر الإرسال قبل التحقق.'
                  : verified
                    ? (reason ?? 'الطلب متاح لمعالجة المرتجع الجزئي.')
                    : 'نحتاج أحدث حالة زحل قبل إتاحة المعالجة.'}
              </Text>
              <Button
                title={uncertain ? 'التحقق من نتيجة المرتجع' : 'تحديث بيانات المرتجع'}
                secondary
                loading={checking.isLoading}
                disabled={busy}
                onPress={() => void verify()}
              />
              {!!receipt.error && (
                <Text accessibilityRole="alert">
                  تعذر قراءة نتيجة المحاولة السابقة. أعد فتح الصفحة للتحقق.
                </Text>
              )}
            </Card>
            {current.items
              .filter((i) => !review || quantities[String(i.orderItemId)] !== undefined)
              .map((item) => {
                const id = String(item.orderItemId),
                  selected = quantities[id] !== undefined;
                return (
                  <Card key={id} style={selected ? { borderColor: p.primary } : undefined}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel={`إرجاع البند ${id}`}
                      accessibilityState={{ checked: selected, disabled: busy || review }}
                      disabled={busy || review}
                      onPress={() =>
                        setQuantities((old) => {
                          const next = { ...old };
                          if (selected) delete next[id];
                          else next[id] = '1';
                          setError('');
                          return next;
                        })
                      }
                      style={ui.section}
                    >
                      <Text style={[ui.title, { flex: 1, fontSize: 18 }]}>
                        {String(item.productName ?? 'منتج')}
                      </Text>
                      <Icon
                        name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={26}
                        color={p.primary}
                      />
                    </Pressable>
                    <Text style={ui.caption}>
                      #{String(item.productCode ?? '—')} · اللون: {String(item.color ?? 'غير محدد')}
                    </Text>
                    <Text style={ui.caption}>الكمية الأصلية: {String(item.quantity)}</Text>
                    {selected &&
                      (review ? (
                        <Text>الكمية المرتجعة: {quantities[id]}</Text>
                      ) : (
                        <Field
                          label={`الكمية المرتجعة للبند ${id}`}
                          value={quantities[id]}
                          keyboardType="number-pad"
                          editable={!busy}
                          onChangeText={(q) => {
                            setQuantities((old) => ({ ...old, [id]: normalizeNumber(q) }));
                            setError('');
                          }}
                        />
                      ))}
                  </Card>
                );
              })}
            {review && (
              <Card>
                <Text style={ui.title}>تقدير التسوية</Text>
                <Text>تسوية التاجر: {amount(summary.merchant)}</Text>
                <Text>تسوية الإدارة: {amount(summary.admin)}</Text>
                <Text>
                  إعادة المخزون:{' '}
                  {summary.stock === null
                    ? 'يحددها الخادم بحسب الخصم السابق'
                    : `${summary.stock} قطعة`}
                </Text>
                <Text style={ui.caption}>
                  التقديرات من الأرباح المحفوظة لكل بند. القيم الناقصة لا تعني صفرًا. إعادة المخزون
                  مشروطة بخصمه سابقًا، والتسوية النهائية يطبقها الخادم.
                </Text>
                {current.isCredited !== true && (
                  <Text style={ui.caption}>
                    تأكيد إضافة الرصيد غير متوفر ضمن البيانات؛ يتحقق الخادم منه قبل قبول المعالجة.
                  </Text>
                )}
                <Text style={ui.caption}>
                  تأكد من كل الكميات؛ لا يمكن تسجيل دفعة ثانية لهذا الطلب.
                </Text>
              </Card>
            )}
            {!!error && (
              <Text accessibilityRole="alert" style={{ color: p.danger }}>
                {error}
              </Text>
            )}
            {review && (
              <Button
                title="تعديل الكميات"
                secondary
                disabled={busy}
                onPress={() => setReview(false)}
              />
            )}
          </>
        )}
      </ScrollView>
      {!saved && (
        <View
          style={{
            padding: 16,
            gap: 8,
            borderTopWidth: 1,
            borderColor: p.border,
            backgroundColor: p.surface,
          }}
        >
          <Text style={ui.link}>
            الأصناف: {input.items.length} · القطع:{' '}
            {Number.isFinite(summary.pieces) ? summary.pieces : '—'}
          </Text>
          <Button
            title={review ? 'تأكيد معالجة المرتجع' : 'مراجعة الكميات'}
            loading={result.isLoading}
            disabled={blocked}
            onPress={() => void submit()}
          />
        </View>
      )}
      <Modal visible={!!leave} transparent onRequestClose={() => setLeave(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }}>
          <Card>
            <Text style={ui.title}>مغادرة معالجة المرتجع؟</Text>
            <Text>سيتم فقد اختيار الكميات غير المحفوظة.</Text>
            <Button title="متابعة التعديل" onPress={() => setLeave(null)} />
            <Button
              title="تجاهل التعديلات والمغادرة"
              secondary
              onPress={() => {
                if (leave) nav.dispatch(leave);
              }}
            />
          </Card>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
