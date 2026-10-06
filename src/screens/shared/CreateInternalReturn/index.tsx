import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useOrderQuery } from '@/api/shared/orders';
import {
  useCreateInternalReturnMutation,
  useInternalReturnReceiptQuery,
  useVerifyInternalReturnMutation,
} from '@/api/shared/internal-returns';
import { actorFromUser } from '@/domain/internal-order-policy';
import {
  createReturnDraft,
  internalReturnDecision,
  returnSourceSnapshot,
  returnItemsTotal,
  validateReturnDraft,
  type ReturnDraft,
} from '@/domain/internal-return';
import { mutationError } from '@/domain/order-workflow';
import { formatMoney } from '@/domain/product-details';
import { normalizeNumber } from '@/components/shared/catalog/catalog-model';
import { useSession } from '@/hooks/shared/use-session';
import { useOrderDeliveryMode } from '@/hooks/shared/use-order-delivery-mode';
import { useScreenProps } from '@/navigation/use-screen-props';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Header from '@/components/shared/HeaderComponent';
import Text from '@/components/shared/CustomText';
import { AsyncState } from '@/components/shared/AsyncState';
import { Button, Card, ui } from '@/components/shared/ui';
import { Field } from '@/components/shared/order-create/Field';
import { palette as p } from '@/theme/tokens';
import type { Order } from '@/types/models';
export default function CreateInternalReturn() {
  const { route } = useScreenProps();
  const id = String(route.params.orderId ?? '');
  const query = useOrderQuery(id, { skip: !id, refetchOnMountOrArgChange: true });
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <Header title="إنشاء مرتجع داخلي" />
      <AsyncState
        loading={query.isLoading}
        error={query.error}
        empty={!id ? 'معرف الطلب غير متوفر' : undefined}
        onRetry={() => {
          if (id) void query.refetch();
        }}
      />
      {query.currentData && (
        <ReturnForm key={id} order={query.currentData} stale={!!query.error || query.isFetching} />
      )}
    </ScreenContainer>
  );
}
function ReturnForm({ order, stale }: { order: Order; stale: boolean }) {
  const { userData } = useSession();
  const { navigation } = useScreenProps();
  const nav = useNavigation();
  const mode = useOrderDeliveryMode(order);
  const [source] = useState(order);
  const [draft, setDraft] = useState(() => createReturnDraft(order));
  const [dirty, setDirty] = useState(false),
    [review, setReview] = useState(false),
    [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState('');
  const [leave, setLeave] = useState<NavigationAction | null>(null);
  const [submit, result] = useCreateInternalReturnMutation();
  const [verify, verification] = useVerifyInternalReturnMutation();
  const receiptQuery = useInternalReturnReceiptQuery({
    orderId: order.orderId,
    userId: userData?.userId ?? '',
    role: userData?.role ?? '',
  });
  const receipt = result.data ?? receiptQuery.currentData;
  const saved = receipt?.state === 'saved';
  const lock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [review, saved]);
  const busy = result.isLoading || verification.isLoading;
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
  const decision = internalReturnDecision(order, mode.mode, actorFromUser(userData));
  const changed = returnSourceSnapshot(order) !== returnSourceSnapshot(source);
  const validation = validateReturnDraft(source, draft);
  const total = returnItemsTotal(validation.body.items);
  const change = (id: number, patch: Partial<ReturnDraft[number]>) => {
    setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
    setDirty(true);
    setError('');
  };
  const commit = async () => {
    if (lock.current || busy || stale || saved || receipt?.state === 'uncertain') return;
    setShowErrors(true);
    if (!validation.valid) return;
    if (!review) {
      setReview(true);
      return;
    }
    lock.current = true;
    setError('');
    try {
      await submit({
        orderId: order.orderId,
        draft,
        expectedSnapshot: returnSourceSnapshot(source),
      }).unwrap();
    } catch (e) {
      setError(mutationError(e));
      setReview(false);
    } finally {
      lock.current = false;
    }
  };
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
              ? 'تم إنشاء المرتجع'
              : review
                ? 'راجع المرتجع قبل الإنشاء'
                : 'استرجاع بخطوات واضحة'}
          </Text>
          <Text style={ui.caption}>
            الطلب الأصلي #{order.orderId} · {order.customerName}
          </Text>
          <Text style={ui.caption}>
            {saved
              ? 'تم حفظ طلب المرتجع. لا تتم تسوية الرصيد أو إعادة المخزون إلا عند إكماله.'
              : '١ اختيار الأصناف والأسعار  ·  ٢ المراجعة والتأكيد'}
          </Text>
        </Card>
        {saved ? (
          <Card>
            <Text>تم تسجيل الإنشاء بنجاح؛ لا تعِد إرسال الطلب.</Text>
            {receipt?.orderId ? (
              <Button
                title={`عرض المرتجع #${receipt.orderId}`}
                onPress={() => navigation.replace('OrderDetails', { orderId: receipt.orderId })}
              />
            ) : (
              <Text style={ui.caption}>
                لم يتوفر رابط موثّق للمرتجع الجديد. يمكنك متابعته من قائمة الطلبات.
              </Text>
            )}
            <Button
              title="العودة للطلبات"
              secondary
              onPress={() => navigation.replace('MyOrders')}
            />
          </Card>
        ) : (
          <>
            {!!receiptQuery.error && (
              <Text accessibilityRole="alert">
                تعذر التحقق من المحاولات السابقة. أعد فتح الصفحة قبل المتابعة.
              </Text>
            )}
            {(!decision.allowed || changed) && (
              <Card>
                <Text accessibilityRole="alert" style={{ color: p.danger }}>
                  {changed
                    ? 'تغيرت بيانات الطلب. ارجع للتفاصيل وأعد فتح إنشاء المرتجع.'
                    : decision.reason}
                </Text>
              </Card>
            )}
            {receipt?.state === 'uncertain' && (
              <Card>
                <Text accessibilityRole="alert">
                  نتيجة الإنشاء غير مؤكدة؛ لن نكرر الإرسال قبل التحقق.
                </Text>
                <Button
                  title="التحقق من المحاولة السابقة"
                  secondary
                  loading={verification.isLoading}
                  onPress={async () => {
                    try {
                      const value = await verify(order.orderId).unwrap();
                      setError(
                        value?.state === 'uncertain'
                          ? 'الخادم لم يؤكد نتيجة المحاولة بعد. راجع الإدارة قبل إعادة الإنشاء.'
                          : '',
                      );
                    } catch (e) {
                      setError(mutationError(e));
                    }
                  }}
                />
              </Card>
            )}
            {!review && (
              <Button
                title="تحديد كل الأصناف"
                secondary
                disabled={busy}
                onPress={() => {
                  setDraft((d) =>
                    Object.fromEntries(
                      Object.entries(d).map(([id, row]) => [id, { ...row, selected: true }]),
                    ),
                  );
                  setDirty(true);
                }}
              />
            )}
            {source.items
              .filter((item) => !review || draft[Number(item.orderItemId)]?.selected)
              .map((item) => {
                const id = Number(item.orderItemId),
                  row = draft[id];
                return (
                  <Card key={id} style={row.selected ? { borderColor: p.primary } : undefined}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel={`إرجاع ${item.productName ?? id}`}
                      accessibilityState={{ checked: row.selected, disabled: review || busy }}
                      disabled={review || busy}
                      onPress={() => change(id, { selected: !row.selected })}
                      style={ui.section}
                    >
                      <Text style={[ui.title, { flex: 1, fontSize: 18 }]}>
                        {String(item.productName ?? 'منتج')}
                      </Text>
                      <Icon
                        name={row.selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={26}
                        color={p.primary}
                      />
                    </Pressable>
                    <Text style={ui.caption}>
                      بند #{id} · الكمية الأصلية: {String(item.quantity)}
                    </Text>
                    {row.selected &&
                      (review ? (
                        <>
                          <Text>
                            الكمية: {row.quantity} · اللون: {row.color.trim()}
                          </Text>
                          <Text>سعر إرجاع الوحدة: {formatMoney(Number(row.price))}</Text>
                          <Text style={ui.link}>
                            الإجمالي:{' '}
                            {formatMoney(
                              returnItemsTotal([
                                {
                                  quantity: Number(row.quantity),
                                  returnPriceUSD: Number(row.price),
                                },
                              ]),
                            )}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Field
                            label={`كمية الإرجاع للبند ${id}`}
                            value={row.quantity}
                            keyboardType="number-pad"
                            editable={!busy}
                            onChangeText={(v) => change(id, { quantity: normalizeNumber(v) })}
                            error={showErrors ? validation.errors[id + '.quantity'] : undefined}
                          />
                          <Field
                            label={`سعر إرجاع الوحدة بالدولار للبند ${id}`}
                            value={row.price}
                            placeholder="أدخل السعر المتفق عليه"
                            keyboardType="decimal-pad"
                            editable={!busy}
                            onChangeText={(v) => change(id, { price: normalizeNumber(v) })}
                            error={showErrors ? validation.errors[id + '.price'] : undefined}
                          />
                          <Field
                            label={`لون البند ${id}`}
                            value={row.color}
                            editable={!busy}
                            onChangeText={(v) => change(id, { color: v })}
                            error={showErrors ? validation.errors[id + '.color'] : undefined}
                          />
                        </>
                      ))}
                  </Card>
                );
              })}
            <Card>
              <Text style={ui.title}>ملخص المرتجع</Text>
              <Text>الأصناف المختارة: {validation.body.items.length}</Text>
              <Text style={ui.title}>القيمة: {formatMoney(validation.valid ? total : null)}</Text>
              <Text style={ui.caption}>
                سينشأ طلب مرتجع مستقل مرتبط بالأصل، بحالة قيد المعالجة ومنطقة دمشق. تُنسخ بيانات
                العميل بواسطة الخادم.
              </Text>
              <Text style={ui.caption}>
                يمكن إنشاء مرتجع واحد فقط حتى لو كان جزئيًا. هذه قيمة الأصناف وليست تأكيدًا لتحويل
                مبلغ للعميل. التسوية والمخزون عند إكمال المرتجع فقط.
              </Text>
            </Card>
            {(error || (showErrors && validation.errors.form)) && (
              <Text accessibilityRole="alert" style={{ color: p.danger }}>
                {error || validation.errors.form}
              </Text>
            )}
            <Button
              title={review ? 'تأكيد إنشاء المرتجع' : 'مراجعة المرتجع'}
              loading={result.isLoading}
              disabled={
                !decision.allowed ||
                changed ||
                stale ||
                mode.isFetching ||
                busy ||
                !!receipt ||
                receiptQuery.isFetching ||
                !!receiptQuery.error
              }
              onPress={() => void commit()}
            />
            {review && (
              <Button
                title="تعديل الأصناف"
                secondary
                disabled={busy}
                onPress={() => setReview(false)}
              />
            )}
          </>
        )}
      </ScrollView>
      <Modal
        visible={!!leave}
        transparent
        animationType="fade"
        onRequestClose={() => setLeave(null)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }}>
          <Card>
            <Text style={ui.title}>مغادرة إنشاء المرتجع؟</Text>
            <Text>سيتم فقد التعديلات التي لم تحفظها.</Text>
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
