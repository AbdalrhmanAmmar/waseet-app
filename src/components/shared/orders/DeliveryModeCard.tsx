import { View } from 'react-native';
import Text from '../CustomText';
import { Card, Button, ui } from '../ui';
import type { DeliveryMode } from '@/domain/order-workflow';
export function DeliveryModeCard({
  mode,
  loading,
  retry,
}: {
  mode: DeliveryMode;
  loading: boolean;
  retry: () => void;
}) {
  return (
    <Card>
      <Text style={ui.title}>
        {loading
          ? 'جارٍ التحقق من جهة التوصيل'
          : mode === 'internal'
            ? 'توصيل داخلي'
            : mode === 'external'
              ? 'حالة زحل'
              : 'تعذر تحديد جهة التوصيل'}
      </Text>
      <Text style={ui.caption}>
        {loading
          ? 'انتظر التحقق لإتاحة الإجراءات المناسبة.'
          : mode === 'internal'
            ? 'تظهر الإجراءات المسموحة حسب دورك وحالة الطلب وملكيته.'
            : mode === 'external'
              ? 'حالة الطلب مستقلة عن حالة زحل. الإجراءات والتعديل حسب صلاحياتك، وحركة التوصيل تُحدّث من شركة التوصيل.'
              : 'التعديل وتغيير الحالة مقفلان حتى يتم التحقق من منطقة الطلب.'}
      </Text>
      {!loading && mode === 'unknown' && (
        <View>
          <Button title="إعادة التحقق من التوصيل" secondary onPress={retry} />
        </View>
      )}
    </Card>
  );
}
