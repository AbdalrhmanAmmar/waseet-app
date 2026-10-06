import { ReturnSettlement } from './InternalReturnPanel';
import { returnSettlementSnapshot } from '@/domain/internal-return';
import {
  externalTerminal,
  externalTargets,
  externalActionReason,
  externalActionCopy,
} from '@/domain/external-order-policy';
import { useRefreshExternalOrderMutation } from '@/api/shared/external-orders';
import { resolveDeliveryMode } from '@/domain/order-delivery-list';
import { useSession } from '@/hooks/shared/use-session';
import {
  actorFromUser,
  internalTargets,
  internalTerminal,
  internalRequiresNote,
  internalActionCopy,
} from '@/domain/internal-order-policy';
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
import { useOrderQuery } from '@/api/shared/orders';
import { statusLabel } from '@/components/shared/orders/statuses';
import { normalizeStatus, mutationError } from '@/domain/order-workflow';
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
  const { userData } = useSession();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const query = useOrderQuery(orderId, { refetchOnMountOrArgChange: true });
  const areas = useDeliveryAreasQuery(undefined, { refetchOnMountOrArgChange: true });
  const lock = useRef(false);
  const [checking, setChecking] = useState(false);
  const busy = saving || checking;
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState(false);
  const [settlement, setSettlement] = useState<string>();
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const order = query.currentData;
  const mode = order
    ? resolveDeliveryMode(order, areas.error ? [] : (areas.currentData ?? []))
    : 'unknown';
  const contextError = mode === 'unknown';
  const resolvingStuck = normalizeStatus(order?.status) === 'stuck';
  const loading = query.isFetching || areas.isFetching;
  const validOrder = order && String(order.orderId) === String(orderId);
  const terminal =
    order &&
    (mode === 'internal' ? internalTerminal(order.status) : externalTerminal(order.status));
  const options = !terminal
    ? mode === 'internal' && order
      ? internalTargets(order, actorFromUser(userData), mode).map((value) => ({
          status: value,
          isTerminal: internalTerminal(value),
          reason: null,
        }))
      : order
        ? externalTargets(order, actorFromUser(userData), mode).map((value) => ({
            status: value,
            isTerminal: value === 'Cancelled',
            reason: externalActionReason(order, value),
          }))
        : []
    : [];
  const selected = options.find((item) => item.status === status && !item.reason);
  const ready = !loading && !query.error && !contextError && validOrder && !!selected;
  const needsNote = internalRequiresNote(order?.status ?? '', status);
  const [verify, verification] = useRefreshExternalOrderMutation();
  const [uncertain, setUncertain] = useState(false);
  const copy = mode === 'external' ? externalActionCopy : internalActionCopy;
  const close = () => {
    if (!lock.current) onClose();
  };
  const confirm = async () => {
    if (!ready || busy || uncertain || lock.current) return;
    if (needsNote && !notes.trim()) {
      setError(
        resolvingStuck
          ? 'اكتب ملاحظة حل التعثر قبل المتابعة.'
          : 'اكتب سبب تعثر الطلب قبل المتابعة.',
      );
      return;
    }
    setError('');
    if (!review) {
      setSettlement(order ? returnSettlementSnapshot(order) : undefined);
      setAcknowledged(false);
      setReview(true);
      return;
    }
    if (mode === 'internal' && normalizeStatus(status) === 'completedreturned' && !acknowledged) {
      setError('أكد مراجعة الكميات والتسوية أولًا.');
      return;
    }
    lock.current = true;
    setChecking(true);
    try {
      await save({
        orderId,
        status,
        notes: notes.trim(),
        expectedStatus: order?.status,
        expectedReturnSettlement: settlement,
      });
      onSaved();
    } catch (err) {
      setError(mutationError(err));
      if ((err as { status?: string })?.status === 'STATUS_UNCERTAIN') setUncertain(true);
      setReview(false);
      setStatus('');
      void query.refetch();
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
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 4,
              backgroundColor: p.border,
              alignSelf: 'center',
              marginBottom: 4,
            }}
          />
          <View style={s.section}>
            <Text accessibilityRole="header" style={s.sectionTitle}>
              {review
                ? 'تأكيد تحديث الحالة'
                : resolvingStuck
                  ? 'حل الطلب المتعثر'
                  : 'إجراءات الطلب'}
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
            ) : query.error || contextError || !validOrder ? (
              <View style={s.notice}>
                <Text accessibilityRole="alert" style={s.error}>
                  تعذر التحقق من الطلب وجهة التوصيل والحالات المتاحة.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void query.refetch();
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
                <Text style={s.hint}>{copy[normalizeStatus(selected.status)]?.effect}</Text>
                {selected.isTerminal && (
                  <Text style={s.hint}>هذه حالة نهائية؛ تأكد من اختيارك قبل الحفظ.</Text>
                )}
                {mode === 'internal' && normalizeStatus(status) === 'completedreturned' && (
                  <>
                    <ReturnSettlement order={order} />
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel="راجعت الكميات والتسوية وأوافق على إكمال المرتجع"
                      accessibilityState={{ checked: acknowledged }}
                      disabled={busy}
                      onPress={() => setAcknowledged((v) => !v)}
                      style={s.option}
                    >
                      <Icon
                        name={acknowledged ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={p.primary}
                      />
                      <Text style={[s.hint, { flex: 1 }]}>
                        راجعت الكميات والتسوية وأوافق على إكمال المرتجع
                      </Text>
                    </Pressable>
                  </>
                )}
                {!!notes.trim() && <Text style={s.address}>{notes.trim()}</Text>}
              </View>
            ) : (
              <>
                <Text style={s.hint}>
                  {mode === 'external'
                    ? 'حالة زحل تُحدّث من شركة التوصيل'
                    : `توصيل داخلي · ${String(order.orderType).toLowerCase() === 'return' ? 'طلب مرتجع' : 'طلب عادي'}`}
                </Text>
                <View style={[s.notice, { flexDirection: 'row-reverse', alignItems: 'center' }]}>
                  <Icon
                    name={
                      String(order.orderType).toLowerCase() === 'return'
                        ? 'package-variant-closed'
                        : 'clipboard-check-outline'
                    }
                    size={26}
                    color={p.primary}
                  />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.hint}>الحالة الحالية</Text>
                    <Text style={[s.name, { fontSize: 18 }]}>{statusLabel(order.status)}</Text>
                  </View>
                </View>
                {!options.length && (
                  <Text style={s.hint}>
                    لا توجد إجراءات متاحة لحسابك. يجب اكتمال بيانات نوع الطلب والملكية للتحقق من
                    الصلاحيات.
                  </Text>
                )}
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
                      mode === 'internal' &&
                        normalizeStatus(item.status) === 'cancelled' && {
                          borderColor: '#EBC9C6',
                          backgroundColor: '#FFF8F7',
                        },
                      !!item.reason && s.disabled,
                      status === item.status && { borderColor: p.primary, backgroundColor: p.soft },
                    ]}
                  >
                    <Icon
                      name={
                        status === item.status
                          ? 'radiobox-marked'
                          : mode === 'internal'
                            ? (internalActionCopy[normalizeStatus(item.status)]?.icon ??
                              'radiobox-blank')
                            : 'radiobox-blank'
                      }
                      size={22}
                      color={normalizeStatus(item.status) === 'cancelled' ? p.danger : p.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.buttonText}>
                        {copy[normalizeStatus(item.status)]?.label ?? statusLabel(item.status)}
                      </Text>
                      <Text style={s.hint}>{copy[normalizeStatus(item.status)]?.effect}</Text>
                      {!!item.reason && <Text style={s.hint}>{item.reason}</Text>}
                    </View>
                  </Pressable>
                ))}

                {!!options.length && (
                  <Text style={s.hint}>
                    {needsNote ? 'ملاحظة مطلوبة لإتمام الإجراء' : 'ملاحظة للمتابعة (اختياري)'} ·{' '}
                    {notes.length}/500
                  </Text>
                )}

                {!!options.length && (
                  <TextInput
                    accessibilityLabel="ملاحظات تغيير الحالة"
                    placeholder={
                      resolvingStuck && needsNote
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
                )}
              </>
            )}
            {!!error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
          </ScrollView>
          {uncertain && (
            <Pressable
              accessibilityRole="button"
              disabled={verification.isLoading}
              style={s.secondary}
              onPress={async () => {
                try {
                  await verify({ orderId, sync: false }).unwrap();
                  await query.refetch().unwrap();
                  setUncertain(false);
                  setError('');
                } catch (e) {
                  setError(mutationError(e));
                }
              }}
            >
              <Text style={s.buttonText}>التحقق من نتيجة المحاولة السابقة</Text>
            </Pressable>
          )}
          {!!options.length && (
            <View style={{ gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                disabled={!ready || busy || uncertain}
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
