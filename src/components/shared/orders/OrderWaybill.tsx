import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { orderWaybillHtml } from '@/domain/order-waybill';
import type { Order } from '@/types/models';
import Text from '../CustomText';
import { Button, Card, ui } from '../ui';

export function OrderWaybill({ order }: { order: Order }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  const open = async (share: boolean) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const html = orderWaybillHtml(order);
      if (Platform.OS === 'web') {
        const preview = window.open('', '_blank');
        if (!preview) throw new Error('اسمح بفتح نافذة البوليصة من المتصفح ثم حاول مرة أخرى.');
        preview.opener = null;
        preview.document.open();
        preview.document.write(html);
        preview.document.close();
      } else if (share) {
        if (!(await Sharing.isAvailableAsync()))
          throw new Error('المشاركة غير متاحة على هذا الجهاز. يمكنك طباعة البوليصة.');
        const file = await Print.printToFileAsync({ html, width: 420, height: 595 });
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          UTI: '.pdf',
          dialogTitle: `بوليصة الطلب ${order.orderId}`,
        });
      } else await Print.printAsync({ html });
    } catch (e) {
      // Closing iOS's print sheet is a cancellation, not a failed order operation.
      if (!(e instanceof Error && /cancel|printing did not complete/i.test(e.message)))
        setError(e instanceof Error ? e.message : 'تعذر تجهيز البوليصة.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Card>
      <Text style={ui.title}>بوليصة الطلب</Text>
      <Text style={ui.caption}>
        بيانات العميل والمنتجات والألوان والأسعار، جاهزة للطباعة بمقاس A5.
      </Text>
      <Button
        title="معاينة وطباعة البوليصة"
        icon="printer-outline"
        secondary
        disabled={busy}
        onPress={() => void open(false)}
      />
      {Platform.OS !== 'web' && (
        <Button
          title="مشاركة البوليصة PDF"
          secondary
          disabled={busy}
          loading={busy}
          onPress={() => void open(true)}
        />
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: '#b42318' }}>
          {error}
        </Text>
      )}
    </Card>
  );
}
