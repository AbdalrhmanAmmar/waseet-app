import { useRef, useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import GradientBtn from '../GradientBtn';
import { statusLabel } from './statuses';
import { errorMessage } from '@/api/normalizers';
import { useOrderStatusesQuery } from '@/api/shared/orders';
import { AsyncState } from '../AsyncState';
import type { Order, StatusInput } from '@/types/models';
export function StatusEditor({
  order,
  save,
  saving,
}: {
  order: Order;
  save: (value: StatusInput) => Promise<unknown>;
  saving: boolean;
}) {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const submitting = useRef(false);
  const query = useOrderStatusesQuery();
  const current = query.data?.find((item) => item.status === order.status);
  const available = current?.isTerminal
    ? []
    : (query.data?.filter((item) => item.status !== order.status) ?? []);
  const selected = available.find((item) => item.status === status);
  return (
    <View style={{ gap: 12 }}>
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} />
      {current?.isTerminal ? (
        <AsyncState empty="هذا الطلب في حالة نهائية" />
      ) : (
        <>
          <Picker
            selectedValue={status}
            onValueChange={setStatus}
            enabled={!saving && !query.isError}
          >
            <Picker.Item label="اختر الحالة الجديدة" value="" />
            {available.map((item) => (
              <Picker.Item key={item.status} label={statusLabel(item.status)} value={item.status} />
            ))}
          </Picker>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="ملاحظات تغيير الحالة"
            multiline
            maxLength={500}
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 12,
              textAlign: 'right',
            }}
          />
          <GradientBtn
            text="تحديث حالة الطلب"
            isLoading={saving}
            disabled={saving || !selected || query.isError}
            onPress={async () => {
              if (submitting.current || saving || !selected) return;
              if (status === 'Stuck' && !notes.trim()) {
                Alert.alert('ملاحظة مطلوبة', 'اكتب سبب تعثر الطلب');
                return;
              }
              submitting.current = true;
              try {
                await save({ orderId: order.orderId, status, notes });
                setStatus('');
                setNotes('');
                Alert.alert('تم', 'تم تحديث حالة الطلب');
              } catch (error) {
                Alert.alert('تعذر التحديث', errorMessage(error));
              } finally {
                submitting.current = false;
              }
            }}
          />
        </>
      )}
    </View>
  );
}
