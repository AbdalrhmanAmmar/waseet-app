import { useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { Card, Button, ui } from '../ui';
import { colors as p, styles as s } from './workspace-styles';
import { useSession } from '@/hooks/shared/use-session';
import { actorFromUser, isManagement } from '@/domain/internal-order-policy';
import {
  externalReturnReason,
  externalReturnSnapshot,
  validateExternalReturn,
  returnProcessed,
  type ExternalReturnInput,
} from '@/domain/external-order-policy';
import {
  useExternalReturnReceiptQuery,
  useProcessExternalReturnMutation,
  useRefreshExternalOrderMutation,
} from '@/api/shared/external-orders';
import { OrderStatusSummary } from './OrderStatusSummary';
import { mutationError } from '@/domain/order-workflow';
import type { Order } from '@/types/models';
export function ExternalOrderPanel({ order }: { order: Order }) {
  const { userData } = useSession(),
    actor = actorFromUser(userData);
  const [refresh, refreshing] = useRefreshExternalOrderMutation();
  const [process, result] = useProcessExternalReturnMutation();
  const receipt = useExternalReturnReceiptQuery({
    orderId: order.orderId,
    userId: userData?.userId ?? '',
    role: userData?.role ?? '',
  });
  const [open, setOpen] = useState(false),
    [review, setReview] = useState(false),
    [error, setError] = useState(''),
    [updated, setUpdated] = useState(false);
  const [snapshot, setSnapshot] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const busy = refreshing.isLoading || result.isLoading,
    lock = useRef(false),
    insets = useSafeAreaInsets();
  const reason = externalReturnReason(order, actor, 'external');
  const saved = receipt.data?.state === 'saved' || returnProcessed(order),
    uncertain = receipt.data?.state === 'uncertain';
  const input: ExternalReturnInput = {
    items: Object.entries(quantities).map(([id, q]) => ({
      orderItemId: Number(id),
      quantity: Number(
        q
          .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
          .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)),
      ),
    })),
  };
  const verify = async () => {
    if (lock.current) return;
    lock.current = true;
    setError('');
    try {
      await refresh({ orderId: order.orderId, sync: true }).unwrap();
      setUpdated(true);
    } catch (e) {
      setError(mutationError(e));
    } finally {
      lock.current = false;
    }
  };
  const submit = async () => {
    if (lock.current || saved || uncertain) return;
    const invalid = reason || validateExternalReturn(order, input);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!review) {
      setReview(true);
      setError('');
      return;
    }
    lock.current = true;
    setError('');
    try {
      await process({ orderId: order.orderId, input, expectedSnapshot: snapshot }).unwrap();
      setOpen(false);
      setReview(false);
    } catch (e) {
      setError(mutationError(e));
      setReview(false);
    } finally {
      lock.current = false;
    }
  };
  return (
    <>
      <Card>
        <Text style={ui.title}>حالة زحل</Text>
        <OrderStatusSummary order={order} mode="external" showMode={false} />
        {!!order.oliverySequence && (
          <Text style={ui.caption}>مرجع الشحنة: {String(order.oliverySequence)}</Text>
        )}
        <Button
          title="تحديث حالة زحل"
          secondary
          loading={refreshing.isLoading}
          disabled={busy}
          onPress={() => void verify()}
        />
        {updated && <Text style={ui.caption}>تم تحديث حالة زحل في هذه الصفحة.</Text>}
        {!!error && !open && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
      </Card>
      {(isManagement(actor) || saved) && (
        <Card>
          <Text style={ui.title}>المرتجع الجزئي</Text>
          <Text style={ui.caption}>
            {saved
              ? 'تم تسجيل مرتجع لهذا الطلب.'
              : uncertain
                ? 'نتيجة المعالجة السابقة غير مؤكدة. حدّث البيانات للتحقق قبل أي محاولة أخرى.'
                : (reason ??
                  'حدد المنتجات والكميات التي عادت فعليًا. تُسجّل العملية مرة واحدة دون تغيير حالة الطلب.')}
          </Text>
          {!saved && (
            <Button
              title={uncertain ? 'التحقق من نتيجة المرتجع' : 'معالجة المرتجع الجزئي'}
              secondary
              disabled={busy || (!uncertain && !!reason)}
              onPress={() => {
                if (uncertain) {
                  void verify();
                  return;
                }
                setSnapshot(externalReturnSnapshot(order));
                setReview(false);
                setError('');
                setOpen(true);
              }}
            />
          )}
        </Card>
      )}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              s.sheet,
              { marginTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 20) },
            ]}
            accessibilityViewIsModal
          >
            <View style={s.section}>
              <Text style={s.sectionTitle}>
                {review ? 'مراجعة المرتجع' : 'تحديد الكميات المرتجعة'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إغلاق المرتجع"
                disabled={busy}
                onPress={() => setOpen(false)}
                style={s.iconButton}
              >
                <Icon name="close" size={24} color={p.deep} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.sheetBody}>
              <Text style={s.hint}>
                طلب #{order.orderId} · {order.customerName}
              </Text>
              {review && (
                <View style={s.notice}>
                  <Text style={s.name}>عملية واحدة لهذا الطلب</Text>
                  <Text style={s.hint}>
                    تأكد من الكميات الفعلية. ستتم تسوية المخزون والأرباح للكميات المختارة فقط، ولا
                    يمكن تسجيل دفعة ثانية.
                  </Text>
                </View>
              )}
              {order.items
                .filter((i) => !review || quantities[String(i.orderItemId)] !== undefined)
                .map((item) => {
                  const id = String(item.orderItemId),
                    selected = quantities[id] !== undefined;
                  const profit =
                    typeof item.merchantProfitUSD === 'number' &&
                    typeof item.quantity === 'number' &&
                    item.quantity > 0
                      ? (item.merchantProfitUSD / item.quantity) *
                        Number(input.items.find((row) => row.orderItemId === Number(id))?.quantity)
                      : null;
                  return (
                    <View key={id} style={s.card}>
                      {!review && (
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityLabel={`إرجاع البند ${id}`}
                          accessibilityState={{ checked: selected }}
                          disabled={busy}
                          onPress={() =>
                            setQuantities((old) => {
                              const next = { ...old };
                              if (selected) delete next[id];
                              else next[id] = '1';
                              return next;
                            })
                          }
                        >
                          <Text style={s.buttonText}>
                            {selected ? '☑' : '☐'} {String(item.productName ?? 'منتج')}
                          </Text>
                        </Pressable>
                      )}
                      {review && <Text style={s.name}>{String(item.productName ?? 'منتج')}</Text>}
                      <Text style={s.hint}>
                        اللون: {String(item.color ?? 'غير محدد')} · الكمية الأصلية:{' '}
                        {String(item.quantity)}
                      </Text>
                      {selected &&
                        (review ? (
                          <Text style={s.buttonText}>الكمية المرتجعة: {quantities[id]}</Text>
                        ) : (
                          <TextInput
                            accessibilityLabel={`الكمية المرتجعة للبند ${id}`}
                            value={quantities[id]}
                            keyboardType="number-pad"
                            editable={!busy}
                            onChangeText={(q) => setQuantities((old) => ({ ...old, [id]: q }))}
                            style={[s.notes, { minHeight: 48 }]}
                          />
                        ))}
                      {selected && (
                        <Text style={s.hint}>
                          تقدير تسوية ربح التاجر:{' '}
                          {profit !== null && Number.isFinite(profit)
                            ? `${profit.toFixed(4)} USD`
                            : 'غير متاح'}
                        </Text>
                      )}
                    </View>
                  );
                })}
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
            </ScrollView>
            <Button
              title={review ? 'تأكيد معالجة المرتجع' : 'مراجعة الكميات'}
              loading={result.isLoading}
              disabled={busy || saved || uncertain || !!reason}
              onPress={() => void submit()}
            />
            {review && (
              <Button
                title="تعديل الكميات"
                secondary
                disabled={busy}
                onPress={() => setReview(false)}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
