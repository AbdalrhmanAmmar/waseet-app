import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { palette as p, typography as t } from '@/theme/tokens';
import {
  defaultFilters,
  normalizeNumber,
  priceRangeError,
  sortOptions,
  type Filters,
} from './catalog-model';
export function CatalogFilters({
  initial,
  categories,
  complete,
  onClose,
  onApply,
}: {
  initial: Filters;
  categories: string[];
  complete: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const apply = () => {
    const normalized = {
      ...draft,
      min: normalizeNumber(draft.min),
      max: normalizeNumber(draft.max),
    };
    const message = priceRangeError(normalized);
    setError(message);
    if (!message) onApply(normalized);
  };
  return (
    <Modal
      transparent
      visible
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.overlay}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="إغلاق الفلاتر"
          accessibilityRole="button"
        />
        <View
          style={[
            s.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), marginTop: insets.top + 12 },
          ]}
          accessibilityViewIsModal
        >
          <View style={s.handle} />
          <View style={s.header}>
            <Text accessibilityRole="header" style={s.title}>
              تصفية وترتيب
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق"
              onPress={onClose}
              style={s.close}
            >
              <Icon name="close" size={24} color={p.deep} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
            <Text style={s.label}>التصنيف</Text>
            {!complete && <Text style={s.note}>تظهر تصنيفات إضافية مع اكتمال تحميل المنتجات.</Text>}
            <View style={s.pills}>
              {['', ...categories].map((category) => (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  aria-selected={draft.category === category}
                  onPress={() => setDraft({ ...draft, category })}
                  style={[s.pill, draft.category === category && s.selected]}
                >
                  <Text style={[s.pillText, draft.category === category && s.white]}>
                    {category || 'الكل'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={s.availability}>
              <Text style={s.label}>المتوفر فقط</Text>
              <Switch
                accessibilityLabel="المتوفر فقط"
                value={draft.available}
                onValueChange={(available) => setDraft({ ...draft, available })}
                trackColor={{ false: '#DDE2DE', true: p.primary }}
                thumbColor="#fff"
              />
            </View>
            <Text style={s.label}>نطاق السعر (USD)</Text>
            <View style={s.range}>
              <View style={s.field}>
                <Text style={s.note}>من</Text>
                <TextInput
                  accessibilityLabel="السعر الأدنى"
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={draft.min}
                  onChangeText={(min) => {
                    setError('');
                    setDraft({ ...draft, min });
                  }}
                  style={s.input}
                />
              </View>
              <View style={s.field}>
                <Text style={s.note}>إلى</Text>
                <TextInput
                  accessibilityLabel="السعر الأعلى"
                  placeholder="بدون حد"
                  keyboardType="decimal-pad"
                  value={draft.max}
                  onChangeText={(max) => {
                    setError('');
                    setDraft({ ...draft, max });
                  }}
                  style={s.input}
                />
              </View>
            </View>
            <Text style={s.label}>ترتيب النتائج</Text>
            {sortOptions.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                aria-checked={draft.sort === option.id}
                onPress={() => setDraft({ ...draft, sort: option.id })}
                style={s.option}
              >
                <Icon
                  name={draft.sort === option.id ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color={draft.sort === option.id ? p.primary : p.muted}
                />
                <Text>{option.label}</Text>
              </Pressable>
            ))}
            {!!error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
          </ScrollView>
          <View style={s.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تطبيق الفلاتر"
              onPress={apply}
              style={[s.button, s.selected]}
            >
              <Text style={[s.buttonText, s.white]}>تطبيق</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraft({ ...defaultFilters });
                setError('');
              }}
              style={s.button}
            >
              <Text style={s.buttonText}>مسح الفلاتر</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(13,39,30,0.35)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '94%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
  },
  handle: {
    width: 42,
    height: 4,
    backgroundColor: '#CAD4CE',
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
  },
  title: { fontSize: 23, fontFamily: t.bold, color: p.deep },
  close: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  body: { paddingBottom: 12, gap: 8 },
  label: { fontFamily: t.bold, fontSize: 15, color: p.deep },
  note: { color: p.muted, fontSize: 12 },
  pills: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  pill: {
    paddingHorizontal: 17,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F2F5F1',
    borderWidth: 1,
    borderColor: p.border,
  },
  pillText: { fontSize: 13, color: p.deep },
  selected: { backgroundColor: p.primary, borderColor: p.primary },
  white: { color: '#fff' },
  availability: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: p.border,
    paddingVertical: 12,
    marginBottom: 8,
  },
  range: { flexDirection: 'row-reverse', gap: 12, marginBottom: 12 },
  field: { flex: 1, gap: 4 },
  input: {
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
    fontFamily: t.medium,
    fontSize: 16,
    color: p.deep,
    textAlign: 'right',
  },
  option: { minHeight: 46, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  actions: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: p.border,
  },
  button: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: p.primary,
    borderRadius: 12,
  },
  buttonText: { fontFamily: t.bold, color: p.primary },
  error: { color: p.danger, fontSize: 13 },
});
