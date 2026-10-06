import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { useOrderQuery, useOrderStatusesQuery } from '@/api/shared/orders';
import { statusLabel } from '@/components/shared/orders/statuses';
import { isOrderTerminal } from '@/domain/order-workspace';
import {
  deliveryMode,
  normalizeStatus,
  transitionOptions,
  requiresStatusNote,
  mutationError,
} from '@/domain/order-workflow';
import { useDeliveryAreasQuery } from '@/api/shared/catalog';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import type { Id, StatusInput } from '@/types/models';
import { colors as p, styles as s } from './workspace-styles';
export type OrderStatusSheetProps = { orderId: Id; onClose: () => void; onSaved: () => void };
export function OrderStatusSheet({
  orderId,
  onClose,
  onSaved,
  save,
  saving,
  variant,
}: OrderStatusSheetProps & {
  save: (value: StatusInput) => Promise<unknown>;
  saving: boolean;
  variant: 'delivery' | 'management' | 'merchant' | 'sales';
}) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const query = useOrderQuery(orderId, { refetchOnMountOrArgChange: true });
  const statuses = useOrderStatusesQuery(undefined, { refetchOnMountOrArgChange: true });
  const areas = useDeliveryAreasQuery(undefined, { refetchOnMountOrArgChange: true });
  const lock = useRef(false);
  const [checking, setChecking] = useState(false);
  const busy = saving || checking;
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const order = query.currentData;
  const mode = !areas.error
    ? deliveryMode(order?.customerArea, areas.currentData ?? [])
    : 'unknown';
  const resolvingStuck = normalizeStatus(order?.status) === 'stuck';
  const loading = query.isFetching || statuses.isFetching || areas.isFetching;
  const validOrder = order && String(order.orderId) === String(orderId);
  const terminal = order && isOrderTerminal(order.status, statuses.data);
  const options = !terminal
    ? transitionOptions(mode, order?.status ?? '', statuses.data ?? [])
    : [];
  const selected = options.find((item) => item.status === status && !item.reason);
  const ready =
    !loading &&
    !query.error &&
    !statuses.error &&
    !areas.error &&
    mode !== 'unknown' &&
    validOrder &&
    !!selected;
  const close = () => {
    if (!lock.current) onClose();
  };
  const confirm = async () => {
    if (!ready || busy || lock.current) return;
    if (requiresStatusNote(order?.status ?? '', status) && !notes.trim()) {
      setError(
        resolvingStuck
          ? 'اكتب ملاحظة حل التعثر قبل المتابعة.'
          : 'اكتب سبب تعثر الطلب قبل المتابعة.',
      );
      return;
    }
    setError('');
    if (!review) {
      setReview(true);
      return;
    }
    lock.current = true;
    setChecking(true);
    try {
      await save({ orderId, status, notes: notes.trim(), expectedStatus: order?.status });
      onSaved();
    } catch (err) {
      setError(mutationError(err));
    } finally {
      lock.current = false;
      setChecking(false);
    }
  };
  return (
    <Modal
      transparent
      visible
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessible={false}
          disabled={busy}
        />
        <View
          style={[
            s.sheet,
            { marginTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          accessibilityViewIsModal
          testID={`${variant}-status-sheet`}
        >
          <View style={s.section}>
            <Text accessibilityRole="header" style={s.sectionTitle}>
              {review
                ? 'تأكيد تحديث الحالة'
                : resolvingStuck
                  ? 'حل الطلب المتعثر'
                  : 'تحديث حالة الطلب'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق تحديث الحالة"
              disabled={busy}
              onPress={close}
              style={s.iconButton}
            >
              <Icon name="close" size={24} color={p.deep} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.sheetBody}>
            <Text style={s.hint}>
              طلب #{orderId}
              {order ? ` · ${order.customerName}` : ''}
            </Text>
            {loading ? (
              <ActivityIndicator color={p.primary} />
            ) : query.error ||
              statuses.error ||
              areas.error ||
              mode === 'unknown' ||
              !validOrder ? (
              <View style={s.notice}>
                <Text accessibilityRole="alert" style={s.error}>
                  تعذر التحقق من الطلب وجهة التوصيل والحالات المتاحة.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void query.refetch();
                    void statuses.refetch();
                    void areas.refetch();
                  }}
                  style={s.secondary}
                >
                  <Text style={s.buttonText}>إعادة المحاولة</Text>
                </Pressable>
              </View>
            ) : terminal ? (
              <Text style={s.hint}>هذا الطلب في حالة نهائية</Text>
            ) : review && selected ? (
              <View style={s.notice}>
                <Text style={s.name}>
                  {statusLabel(order.status)} ← {statusLabel(selected.status)}
                </Text>
                <Text style={s.hint}>تأكد أن الحالة الجديدة تطابق ما حدث لهذا الطلب.</Text>
                {selected.isTerminal && (
                  <Text style={s.hint}>هذه حالة نهائية؛ تأكد من اختيارك قبل الحفظ.</Text>
                )}
                {!!notes.trim() && <Text style={s.address}>{notes.trim()}</Text>}
              </View>
            ) : (
              <>
                <Text style={s.hint}>
                  {mode === 'external'
                    ? 'توصيل خارجي: التأكيد أو التعثر أثناء التجهيز، وحل التعثر فقط.'
                    : 'توصيل داخلي: اختر الخطوة التالية المتاحة.'}
                </Text>
                <Text style={s.hint}>الحالة الحالية: {statusLabel(order.status)}</Text>
                {!options.length && <Text style={s.hint}>لا توجد حالات متاحة للتحديث.</Text>}
                {options.map((item) => (
                  <Pressable
                    key={item.status}
                    accessibilityRole="radio"
                    accessibilityLabel={statusLabel(item.status)}
                    aria-checked={status === item.status}
                    disabled={busy || !!item.reason}
                    onPress={() => {
                      setStatus(item.status);
                      setError('');
                    }}
                    style={[
                      s.option,
                      !!item.reason && s.disabled,
                      status === item.status && { borderColor: p.primary, backgroundColor: p.soft },
                    ]}
                  >
                    <Icon
                      name={status === item.status ? 'radiobox-marked' : 'radiobox-blank'}
                      size={22}
                      color={p.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.buttonText}>{statusLabel(item.status)}</Text>
                      {!!item.reason && <Text style={s.hint}>{item.reason}</Text>}
                    </View>
                  </Pressable>
                ))}
                <TextInput
                  accessibilityLabel="ملاحظات تغيير الحالة"
                  placeholder={
                    resolvingStuck
                      ? 'ملاحظة الحل (مطلوبة)'
                      : normalizeStatus(status) === 'stuck'
                        ? 'سبب التعثر (مطلوب)'
                        : 'ملاحظات تغيير الحالة (اختياري)'
                  }
                  value={notes}
                  onChangeText={(text) => {
                    setNotes(text);
                    setError('');
                  }}
                  multiline
                  maxLength={500}
                  editable={!busy}
                  style={s.notes}
                />
              </>
            )}
            {!!error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
          </ScrollView>
          {!!options.length && (
            <View style={{ gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                disabled={!ready || busy}
                onPress={() => void confirm()}
                style={[s.primary, (!ready || busy) && s.disabled]}
              >
                {busy && <ActivityIndicator color="#fff" size="small" />}
                <Text style={[s.buttonText, s.white]}>
                  {busy ? 'جارٍ الحفظ…' : review ? 'تأكيد وحفظ الحالة' : 'مراجعة التغيير'}
                </Text>
              </Pressable>
              {review && (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => {
                    setReview(false);
                    setError('');
                  }}
                  style={s.secondary}
                >
                  <Text style={s.buttonText}>تعديل الاختيار</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
