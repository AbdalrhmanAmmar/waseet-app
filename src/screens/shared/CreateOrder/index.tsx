import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Text from '@/components/shared/CustomText';
import { Button } from '@/components/shared/ui';
import { Field } from '@/components/shared/order-create/Field';
import { ChoiceSheet } from '@/components/shared/order-create/ChoiceSheet';
import { OrderItemEditor } from '@/components/shared/order-create/OrderItemEditor';
import { OrderSummary } from '@/components/shared/order-create/OrderSummary';
import { s } from '@/components/shared/order-create/styles';
import {
  draftItem,
  emptyOrder,
  lineTotal,
  orderPayload,
  orderSubtotal,
  validateOrder,
  type DraftErrors,
  type OrderDraft,
} from '@/domain/order-draft';
import { formatMoney } from '@/domain/product-details';
import { catalogErrorMessage } from '@/domain/catalog-error';
import { normalizeNumber } from '@/components/shared/catalog/catalog-model';
import { catalogApi, refreshProductDetails, useDeliveryAreasQuery } from '@/api/shared/catalog';
import { useCreateOrderMutation } from '@/api/shared/orders';
import { errorMessage } from '@/api/normalizers';
import { useCatalog } from '@/hooks/shared/use-catalog';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { can } from '@/auth/permissions';
import type { ScreenProps } from '@/navigation/use-screen-props';
import type { Id, Product } from '@/types/models';
import { palette as p } from '@/theme/tokens';

export default function CreateOrder({ navigation, route }: ScreenProps) {
  const { role, userData } = useSession();
  const allowed = can(role, 'orders.create');
  const dispatch = useAppDispatch();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();
  const areas = useDeliveryAreasQuery(undefined, {
    skip: !allowed || !userData,
    refetchOnMountOrArgChange: true,
  });
  const [createOrder] = useCreateOrderMutation();
  const [draft, setDraft] = useState<OrderDraft>(() => {
    const initial = emptyOrder();
    const seed = route.params.product as Product | undefined;
    if (seed)
      initial.items = [
        draftItem(seed, Math.max(1, Math.floor(Number(route.params.quantity) || 1))),
      ];
    return initial;
  });
  const [errors, setErrors] = useState<DraftErrors>({});
  const [error, setError] = useState('');
  const [picker, setPicker] = useState<'products' | 'areas' | null>(null);
  const [review, setReview] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [success, setSuccess] = useState<{ orderId?: Id } | null>(null);
  const [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const busy = checking || sending;
  const lock = useRef(false);
  const mounted = useRef(true);
  const scroll = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const dirty = !!(
    draft.customerName ||
    draft.customerMobile ||
    draft.customerArea ||
    draft.customerAddress ||
    draft.items.length
  );
  const selectedArea = areas.data?.find((area) => area.city === draft.customerArea);
  const fee =
    selectedArea?.fee != null && Number.isFinite(selectedArea.fee) && selectedArea.fee >= 0
      ? selectedArea.fee
      : null;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  usePreventRemove(allowed && !success && (dirty || busy), ({ data }) => {
    if (!lock.current) setLeaveAction(data.action);
  });
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty || success) return;
    const listener = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [dirty, success]);
  useEffect(() => {
    if (picker === 'products' && catalog.hasMore && !catalog.fetching && !catalog.error)
      catalog.loadMore();
  }, [picker, catalog]);
  const field = (key: keyof Omit<OrderDraft, 'items'>, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
    setError('');
  };
  const showErrors = (next: DraftErrors) => {
    setErrors(next);
    const first = Object.keys(next)[0];
    const section = first?.startsWith('items') ? 'items' : 'customer';
    scroll.current?.scrollTo({ y: positions.current[section] ?? 0, animated: true });
  };
  const reviewOrder = async () => {
    if (lock.current || !allowed || !userData || uncertain) return;
    const validation = validateOrder(draft, areas.data ?? []);
    if (Object.keys(validation).length) {
      showErrors(validation);
      return;
    }
    lock.current = true;
    setChecking(true);
    setError('');
    try {
      // Refresh only selected products, and keep the operator's edited price and color.
      const freshAreas = await dispatch(
        catalogApi.endpoints.deliveryAreas.initiate(undefined, {
          subscribe: false,
          forceRefetch: true,
        }),
      );
      if (freshAreas.error || !freshAreas.data)
        throw freshAreas.error ?? new Error('تعذر تحميل مناطق التوصيل');
      const freshItems = [];
      for (const row of draft.items) {
        const result = await dispatch(
          refreshProductDetails({ product_id: row.product.productCode, user_id: userData.userId }),
        );
        if (result.error || !result.data) throw result.error ?? new Error('تعذر التحقق من المنتج');
        freshItems.push({ ...row, product: result.data });
      }
      if (!mounted.current) return;
      const freshDraft = { ...draft, items: freshItems };
      setDraft(freshDraft);
      const next = validateOrder(freshDraft, freshAreas.data);
      if (Object.keys(next).length) {
        showErrors(next);
        return;
      }
      setErrors({});
      setReview(true);
    } catch (err) {
      if (mounted.current) setError(`تعذر تجهيز المراجعة: ${errorMessage(err)}`);
    } finally {
      lock.current = false;
      if (mounted.current) setChecking(false);
    }
  };
  const submit = async () => {
    if (lock.current || !review || uncertain || !allowed) return;
    const next = validateOrder(draft, areas.data ?? []);
    if (Object.keys(next).length) {
      setReview(false);
      showErrors(next);
      return;
    }
    lock.current = true;
    setSending(true);
    setError('');
    try {
      const result = await createOrder(orderPayload(draft)).unwrap();
      if (mounted.current) {
        setSuccess(result ?? {});
        setReview(false);
        setDraft(emptyOrder());
      }
    } catch (err) {
      if (!mounted.current) return;
      const status = err && typeof err === 'object' && 'status' in err ? err.status : undefined;
      if (status === 'NETWORK_ERROR' || (typeof status === 'number' && status >= 500)) {
        setUncertain(true);
        setError(
          'لم تصل نتيجة مؤكدة لإنشاء الطلب. راجع آخر الطلبات قبل إنشاء طلب جديد لتجنب التكرار.',
        );
      } else setError(errorMessage(err));
    } finally {
      lock.current = false;
      if (mounted.current) setSending(false);
    }
  };
  const back = () => {
    if (busy) return;
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('MyOrders');
  };
  if (!allowed)
    return (
      <ScreenContainer>
        <View style={s.page}>
          <Text style={s.title}>إنشاء الطلب غير متاح لهذا الحساب</Text>
        </View>
      </ScreenContainer>
    );
  if (success)
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={[s.page, { flex: 1, justifyContent: 'center' }]}>
          <Icon
            name="check-circle-outline"
            size={76}
            color={p.primary}
            style={{ alignSelf: 'center' }}
          />
          <Text style={[s.title, { textAlign: 'center' }]}>تم إنشاء الطلب بنجاح</Text>
          <Text style={[s.caption, { textAlign: 'center' }]}>
            {success.orderId
              ? `رقم الطلب #${success.orderId}`
              : 'يمكنك متابعة الطلب من قائمة الطلبات.'}
          </Text>
          <Button
            title={success.orderId ? 'عرض تفاصيل الطلب' : 'عرض الطلبات'}
            onPress={() =>
              navigation.replace(success.orderId ? 'OrderDetails' : 'MyOrders', {
                orderId: success.orderId,
              })
            }
          />
          <Button
            title="إنشاء طلب آخر"
            secondary
            onPress={() => {
              setSuccess(null);
              setUncertain(false);
              setErrors({});
              setError('');
            }}
          />
        </View>
      </ScreenContainer>
    );
  return (
    <ScreenContainer edges={['top', 'bottom']} backgroundColor={p.background}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          disabled={busy}
          onPress={back}
          style={s.icon}
        >
          <Icon name="arrow-right" color={p.deep} size={25} />
        </Pressable>
        <Text accessibilityRole="header" style={s.subtitle}>
          إنشاء طلب جديد
        </Text>
        <Icon name="file-document-edit-outline" color={p.primary} size={25} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
          <View style={s.hero}>
            <Text style={s.heroTitle}>من التفاصيل إلى طلب جاهز</Text>
            <Text style={s.heroText}>
              أدخل بيانات العميل، اختر المنتجات وألوانها، ثم راجع طلبك قبل الإنشاء.
            </Text>
            <Text style={[s.badge, { alignSelf: 'flex-end' }]}>مسودة غير مرسلة</Text>
          </View>
          <View
            onLayout={(event) => {
              positions.current.customer = event.nativeEvent.layout.y;
            }}
            style={s.card}
            pointerEvents={busy ? 'none' : 'auto'}
          >
            <View style={s.section}>
              <Text style={s.number}>١</Text>
              <Text style={s.subtitle}>بيانات العميل والتوصيل</Text>
            </View>
            <Field
              editable={!busy}
              label="اسم العميل *"
              value={draft.customerName}
              onChangeText={(value) => field('customerName', value)}
              error={errors.customerName}
              placeholder="الاسم الكامل"
            />
            <Field
              editable={!busy}
              label="رقم الهاتف السوري *"
              value={draft.customerMobile}
              onChangeText={(value) =>
                field('customerMobile', normalizeNumber(value).replace(/[^0-9]/g, ''))
              }
              error={errors.customerMobile}
              placeholder="09XXXXXXXX"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={s.field}>
              <Text style={s.label}>منطقة التوصيل *</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="اختيار منطقة التوصيل"
                onPress={() => setPicker('areas')}
                style={[s.input, !!errors.customerArea && s.invalid]}
              >
                <Text style={s.label}>
                  {draft.customerArea || 'اختر المنطقة'} · {formatMoney(fee)}
                </Text>
              </Pressable>
              {!!errors.customerArea && (
                <Text accessibilityRole="alert" style={s.error}>
                  {errors.customerArea}
                </Text>
              )}
              {!!areas.error && (
                <Text style={s.error}>تعذر تحميل المناطق. افتح الاختيار لإعادة المحاولة.</Text>
              )}
            </View>
            <Field
              editable={!busy}
              label="العنوان التفصيلي *"
              value={draft.customerAddress}
              onChangeText={(value) => field('customerAddress', value)}
              error={errors.customerAddress}
              placeholder="الشارع، المبنى، علامة مميزة"
              multiline
            />
          </View>
          <View
            onLayout={(event) => {
              positions.current.items = event.nativeEvent.layout.y;
            }}
            style={s.card}
            pointerEvents={busy ? 'none' : 'auto'}
          >
            <View style={s.section}>
              <Text style={s.number}>٢</Text>
              <Text style={s.subtitle}>المنتجات والأسعار</Text>
            </View>
            <Text style={s.caption}>حدّد الكمية وسعر البيع واللون لكل منتج.</Text>
            {draft.items.map((row) => (
              <OrderItemEditor
                key={row.key}
                row={row}
                disabled={busy}
                errors={errors}
                merchant={role === 'Merchant'}
                onChange={(patch) => {
                  setDraft((previous) => ({
                    ...previous,
                    items: previous.items.map((item) =>
                      item.key === row.key ? { ...item, ...patch } : item,
                    ),
                  }));
                  setErrors({});
                  setError('');
                }}
                onRemove={() => {
                  setDraft((previous) => ({
                    ...previous,
                    items: previous.items.filter((item) => item.key !== row.key),
                  }));
                  setErrors({});
                }}
              />
            ))}
            {!draft.items.length && (
              <Text style={s.caption}>ابدأ باختيار أول منتج لهذا الطلب.</Text>
            )}
            {!!errors.items && (
              <Text accessibilityRole="alert" style={s.error}>
                {errors.items}
              </Text>
            )}
            <Button
              title="إضافة منتج"
              icon="plus"
              secondary
              onPress={() => setPicker('products')}
            />
          </View>
          <OrderSummary draft={draft} fee={fee} />
          {!!error && !review && (
            <View style={s.alert}>
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
              {uncertain && (
                <Button
                  title="مراجعة آخر الطلبات"
                  onPress={() => navigation.navigate('MyOrders')}
                  secondary
                />
              )}
            </View>
          )}
        </ScrollView>
        <View style={s.footer}>
          <View style={s.row}>
            <Text style={s.caption}>الإجمالي المتوقع</Text>
            <Text style={s.money}>
              {formatMoney(fee == null ? null : orderSubtotal(draft) + fee)}
            </Text>
          </View>
          <Button
            title="مراجعة الطلب"
            icon="arrow-left"
            loading={checking}
            disabled={busy || uncertain}
            onPress={reviewOrder}
          />
        </View>
      </KeyboardAvoidingView>
      {picker && (
        <ChoiceSheet
          title={picker === 'products' ? 'المنتجات' : 'مناطق التوصيل'}
          onClose={() => setPicker(null)}
          loading={picker === 'products' ? catalog.fetching : areas.isFetching}
          error={
            picker === 'products'
              ? catalog.error
                ? catalogErrorMessage(catalog.error)
                : undefined
              : areas.error
                ? 'تعذر تحميل مناطق التوصيل'
                : undefined
          }
          onRetry={() => {
            if (picker === 'products') void catalog.retry();
            else
              void dispatch(
                catalogApi.endpoints.deliveryAreas.initiate(undefined, {
                  subscribe: false,
                  forceRefetch: true,
                }),
              );
          }}
          choices={
            picker === 'products'
              ? catalog.data.map((product) => ({
                  key: String(product.productCode),
                  title: product.title,
                  image: product.image,
                  caption: draft.items.some((row) => row.key === String(product.productCode))
                    ? 'مضاف بالفعل — عدّل كميته داخل الطلب'
                    : `#${product.productCode} · ${product.stock > 0 ? `متاح ${product.stock} قطعة` : 'نفدت الكمية'}`,
                  disabled:
                    !Number.isFinite(product.stock) ||
                    product.stock <= 0 ||
                    draft.items.some((row) => row.key === String(product.productCode)),
                }))
              : (areas.data ?? []).map((area) => ({
                  key: String(area.deliveryAreaId),
                  title: area.city,
                  caption: `رسوم التوصيل: ${formatMoney(area.fee)}`,
                  disabled: area.fee == null || !Number.isFinite(area.fee) || area.fee < 0,
                }))
          }
          onSelect={(key) => {
            if (picker === 'products') {
              const product = catalog.data.find((item) => String(item.productCode) === key);
              if (product && !draft.items.some((row) => row.key === key))
                setDraft((previous) => ({
                  ...previous,
                  items: [...previous.items, draftItem(product)],
                }));
            } else {
              const area = areas.data?.find((item) => String(item.deliveryAreaId) === key);
              if (area) field('customerArea', area.city);
            }
            setPicker(null);
            setErrors({});
          }}
        />
      )}
      {review && (
        <Modal
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!busy) setReview(false);
          }}
        >
          <View style={s.overlay}>
            <View
              style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 18), height: '92%' }]}
              accessibilityViewIsModal
            >
              <Text accessibilityRole="header" style={s.title}>
                مراجعة الطلب قبل الإنشاء
              </Text>
              <ScrollView contentContainerStyle={{ gap: 16 }}>
                <View style={s.card}>
                  <Text style={s.subtitle}>بيانات العميل</Text>
                  {[
                    draft.customerName,
                    draft.customerMobile,
                    draft.customerArea,
                    draft.customerAddress,
                  ].map((value, index) => (
                    <Text key={index} style={s.label}>
                      {value}
                    </Text>
                  ))}
                </View>
                <View style={s.card}>
                  <Text style={s.subtitle}>منتجات الطلب</Text>
                  {draft.items.map((row) => (
                    <View key={row.key} style={s.item}>
                      <Text style={s.itemName}>{row.product.title}</Text>
                      <Text style={s.caption}>
                        اللون: {row.color.trim()} · {row.quantity} ×{' '}
                        {formatMoney(Number(row.price))}
                      </Text>
                      <Text style={s.money}>{formatMoney(lineTotal(row))}</Text>
                    </View>
                  ))}
                </View>
                <OrderSummary draft={draft} fee={fee} />
                {!!error && (
                  <Text accessibilityRole="alert" style={s.error}>
                    {error}
                  </Text>
                )}
              </ScrollView>
              <Button
                title="تأكيد وإنشاء الطلب"
                loading={sending}
                disabled={busy || uncertain}
                onPress={submit}
              />
              <Button
                title={uncertain ? 'مراجعة آخر الطلبات' : 'تعديل البيانات'}
                secondary
                disabled={busy}
                onPress={() => {
                  setReview(false);
                  if (uncertain) navigation.navigate('MyOrders');
                }}
              />
            </View>
          </View>
        </Modal>
      )}
      {leaveAction && (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => {
            setLeaveAction(null);
          }}
        >
          <View style={s.overlay}>
            <View
              style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}
              accessibilityViewIsModal
            >
              <Text style={s.title}>مغادرة الطلب؟</Text>
              <Text style={s.caption}>توجد بيانات غير مرسلة. المغادرة ستتجاهل هذه المسودة.</Text>
              <Button
                title="متابعة كتابة الطلب"
                onPress={() => {
                  setLeaveAction(null);
                }}
              />
              <Button
                title="تجاهل البيانات والمغادرة"
                secondary
                onPress={() => {
                  const action = leaveAction;
                  setLeaveAction(null);
                  if (action) nav.dispatch(action);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
}
