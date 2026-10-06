import { useRef, useState } from 'react';
import Text from '../CustomText';
import { Card, Button, ui } from '../ui';
import { useSession } from '@/hooks/shared/use-session';
import { actorFromUser, isManagement } from '@/domain/internal-order-policy';
import { externalReturnReason, returnProcessed } from '@/domain/external-order-policy';
import {
  useExternalReturnReceiptQuery,
  useRefreshExternalOrderMutation,
} from '@/api/shared/external-orders';
import { useScreenProps } from '@/navigation/use-screen-props';
import { OrderStatusSummary } from './OrderStatusSummary';
import { mutationError } from '@/domain/order-workflow';
import type { Order } from '@/types/models';
export function ExternalOrderPanel({ order }: { order: Order }) {
  const { userData } = useSession(),
    actor = actorFromUser(userData);
  const { navigation } = useScreenProps();
  const [refresh, refreshing] = useRefreshExternalOrderMutation();
  const [error, setError] = useState(''),
    [updated, setUpdated] = useState<Date | null>(null);
  const lock = useRef(false);
  const receipt = useExternalReturnReceiptQuery({
    orderId: order.orderId,
    userId: userData?.userId ?? '',
    role: userData?.role ?? '',
  });
  const saved = receipt.data?.state === 'saved' || returnProcessed(order);
  const uncertain = receipt.data?.state === 'uncertain';
  const verify = async () => {
    if (lock.current) return;
    lock.current = true;
    setError('');
    try {
      await refresh({ orderId: order.orderId, sync: true }).unwrap();
      setUpdated(new Date());
    } catch (e) {
      setError(mutationError(e));
    } finally {
      lock.current = false;
    }
  };
  const recorded = order.items.filter((i) => Number(i.returnedQuantity) > 0);
  return (
    <>
      <Card>
        <Text style={ui.title}>متابعة الشحنة · زحل</Text>
        <Text style={ui.caption}>مراحل الشحنة تتحدث من شركة التوصيل تلقائيًا.</Text>
        <OrderStatusSummary order={order} mode="external" showMode={false} />
        {!!order.oliverySequence && (
          <Text style={ui.caption}>مرجع الشحنة: {String(order.oliverySequence)}</Text>
        )}
        <Button
          title="تحديث حالة زحل"
          secondary
          loading={refreshing.isLoading}
          onPress={() => void verify()}
        />
        {updated && (
          <Text style={ui.caption}>
            آخر تحديث ناجح:{' '}
            {updated.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {order.isCredited === true && <Text style={ui.caption}>أكد الخادم إضافة أرصدة الطلب.</Text>}
        {order.isFeeDebited === true && (
          <Text style={ui.caption}>أكد الخادم خصم رسوم التوصيل.</Text>
        )}
        {order.isRestocked === true && <Text style={ui.caption}>أكد الخادم إعادة المخزون.</Text>}
        {!!error && (
          <Text accessibilityRole="alert">لم ينجح التحديث؛ المعروض آخر بيانات متاحة. {error}</Text>
        )}
      </Card>
      {(isManagement(actor) || saved) && (
        <Card>
          <Text style={ui.title}>المرتجع الخارجي</Text>
          <Text style={ui.caption}>
            {saved
              ? 'تم تسجيل مرتجع لهذا الطلب.'
              : uncertain
                ? 'نتيجة المعالجة السابقة غير مؤكدة. تحقق منها قبل إعادة الإرسال.'
                : (externalReturnReason(order, actor, 'external') ??
                  'متاح للمعالجة بعد التحقق من أحدث حالة زحل.')}
          </Text>
          {saved &&
            recorded.map((item) => (
              <Text key={String(item.orderItemId)}>
                {String(item.productName ?? 'منتج')} · الكمية المرتجعة:{' '}
                {String(item.returnedQuantity)}
              </Text>
            ))}
          {saved && !recorded.length && (
            <Text style={ui.caption}>
              تم تأكيد المعالجة؛ حدّث التفاصيل لعرض الكميات المسجلة بالخادم.
            </Text>
          )}
          {isManagement(actor) && !saved && (
            <Button
              title={uncertain ? 'التحقق من نتيجة المرتجع' : 'معالجة المرتجع الجزئي'}
              secondary
              onPress={() =>
                navigation.navigate('ProcessExternalReturn', { orderId: order.orderId })
              }
            />
          )}
        </Card>
      )}
    </>
  );
}
