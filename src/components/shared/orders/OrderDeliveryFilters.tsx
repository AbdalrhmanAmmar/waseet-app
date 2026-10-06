import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../CustomText';
import { Button } from '../ui';
import {
  INTERNAL_DELIVERY_STATUSES,
  EXTERNAL_DELIVERY_STATUSES,
} from '@/domain/order-status-presentation';
import type { useOrderDeliveryFilters } from '@/hooks/shared/use-order-delivery-filters';
export function OrderDeliveryFilters({
  controller,
}: {
  controller: ReturnType<typeof useOrderDeliveryFilters>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inset = useSafeAreaInsets();
  const count = controller.statuses.length + controller.localStatuses.length;
  const groups = [
    {
      title: controller.mode === 'external' ? 'حالة زحل' : 'حالة الطلب',
      catalog:
        controller.mode === 'external' ? EXTERNAL_DELIVERY_STATUSES : INTERNAL_DELIVERY_STATUSES,
      selected: controller.statuses,
      update: controller.setStatuses,
    },
    ...(controller.mode === 'external'
      ? [
          {
            title: 'حالة الطلب داخل الوسيط',
            catalog: INTERNAL_DELIVERY_STATUSES,
            selected: controller.localStatuses,
            update: controller.setLocalStatuses,
          },
        ]
      : []),
  ];
  return (
    <View style={{ gap: 10, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
        {(['all', 'internal', 'external'] as const).map((mode, i) => (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityLabel={`نوع التوصيل ${['الكل', 'داخلي', 'حالة زحل'][i]}`}
            accessibilityState={{ selected: controller.mode === mode }}
            onPress={() => controller.setMode(mode)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              backgroundColor: controller.mode === mode ? '#147D64' : '#EDF6F1',
            }}
          >
            <Text
              style={{
                color: controller.mode === mode ? '#fff' : '#103E32',
                fontFamily: 'Tajawal-Bold',
              }}
            >
              {['الكل', 'داخلي', 'حالة زحل'][i]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        title={`فلترة الحالات${count ? ` (${count})` : ''}`}
        secondary
        icon="filter-variant"
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
      />
      {!!controller.areasQuery.error && (
        <Text style={{ fontSize: 12 }}>
          تعذر تحميل المناطق؛ الطلبات بدون نوع مسجل تظهر ضمن «الكل».{' '}
          <Text onPress={() => void controller.areasQuery.refetch()} style={{ color: '#147D64' }}>
            إعادة المحاولة
          </Text>
        </Text>
      )}
      <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#06261BAA',
            justifyContent: 'flex-end',
            paddingTop: inset.top + 16,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              maxHeight: '95%',
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: Math.max(inset.bottom, 20),
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 22, lineHeight: 32, fontFamily: 'Tajawal-Bold' }}>
              فلترة الطلبات
            </Text>
            <TextInput
              accessibilityLabel="البحث في الحالات"
              placeholder="ابحث عن حالة…"
              value={search}
              onChangeText={setSearch}
              style={{
                padding: 12,
                backgroundColor: '#F0F5F2',
                borderRadius: 12,
                textAlign: 'right',
                fontFamily: 'Tajawal-Regular',
              }}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ gap: 12 }}
            >
              {groups.map((group) => (
                <View key={group.title} style={{ gap: 8 }}>
                  <Text style={{ fontFamily: 'Tajawal-Bold' }}>{group.title}</Text>
                  {Object.entries(group.catalog)
                    .filter(([code, item]) =>
                      `${code} ${item.label}`.toLowerCase().includes(search.trim().toLowerCase()),
                    )
                    .map(([code, item]) => (
                      <Pressable
                        key={code}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`${group.title}: ${item.label}`}
                        accessibilityState={{ checked: group.selected.includes(code) }}
                        onPress={() =>
                          group.update(
                            group.selected.includes(code)
                              ? group.selected.filter((value) => value !== code)
                              : [...group.selected, code],
                          )
                        }
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          backgroundColor: group.selected.includes(code) ? '#DCEFE6' : '#F7F9F7',
                          flexDirection: 'row-reverse',
                          gap: 10,
                        }}
                      >
                        <Text>{group.selected.includes(code) ? '☑' : '☐'}</Text>
                        <Text style={{ flex: 1 }}>{item.label}</Text>
                      </Pressable>
                    ))}
                </View>
              ))}
            </ScrollView>
            <Button title="عرض النتائج" onPress={() => setOpen(false)} />
            <Button
              title="مسح الحالات"
              secondary
              onPress={() => {
                controller.setStatuses([]);
                controller.setLocalStatuses([]);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
