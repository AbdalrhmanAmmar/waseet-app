import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTACT_ITEMS } from '@/config/contact';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { palette as p, typography as t } from '@/theme/tokens';
import Text from '../CustomText';
export function SupportSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [error, setError] = useState('');
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="إغلاق نافذة الدعم"
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <View style={s.header}>
            <Text style={s.title}>تواصل مع الدعم</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              onPress={onClose}
              style={s.close}
            >
              <Icon name="close" size={23} color={p.deep} />
            </Pressable>
          </View>
          <Text style={s.hint}>فريق الدعم هنا لمساعدتك في حالة حسابك.</Text>
          {CONTACT_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="link"
              accessibilityLabel={`${item.label} ${item.subtitle}`}
              style={s.contact}
              onPress={async () => {
                setError('');
                try {
                  await Linking.openURL(item.url);
                } catch {
                  setError('تعذر فتح وسيلة التواصل. يمكنك استخدام الرقم الموضح أعلاه.');
                }
              }}
            >
              <Icon
                name={item.icon as React.ComponentProps<typeof Icon>['name']}
                size={26}
                color={p.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{item.label}</Text>
                <Text selectable style={s.number}>
                  {item.subtitle}
                </Text>
              </View>
              <Icon name="open-in-new" size={20} color={p.primary} />
            </Pressable>
          ))}
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: p.danger }}>
              {error}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#103E3270', justifyContent: 'flex-end' },
  sheet: {
    padding: 24,
    gap: 16,
    backgroundColor: p.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: t.bold, fontSize: 23, lineHeight: 32, color: p.deep },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  hint: { color: p.muted },
  contact: {
    flexDirection: 'row-reverse',
    gap: 14,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: p.border,
  },
  label: { fontFamily: t.bold },
  number: { writingDirection: 'ltr', textAlign: 'right', color: p.muted },
});
