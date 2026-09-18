import { useState } from 'react';
import { ActivityIndicator, Image, FlatList, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '../CustomText';
import { Button } from '../ui';
import { Field } from './Field';
import { s } from './styles';
import { normalizeNumber, normalizeSearch } from '../catalog/catalog-model';
import { palette as p } from '@/theme/tokens';
export interface Choice {
  key: string;
  title: string;
  caption: string;
  disabled?: boolean;
  image?: string;
}
export function ChoiceSheet({
  title,
  choices,
  loading,
  error,
  onRetry,
  onClose,
  onSelect,
}: {
  title: string;
  choices: Choice[];
  loading?: boolean;
  error?: string;
  onRetry: () => void;
  onClose: () => void;
  onSelect: (key: string) => void;
}) {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const filtered = choices.filter((row) =>
    normalizeSearch(`${row.title} ${row.key}`).includes(normalizeSearch(normalizeNumber(search))),
  );
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View
          style={[s.sheet, { paddingBottom: Math.max(18, insets.bottom), height: '85%' }]}
          accessibilityViewIsModal
        >
          <View style={s.row}>
            <Text accessibilityRole="header" style={s.subtitle}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق الاختيار"
              onPress={onClose}
              style={s.icon}
            >
              <Icon name="close" size={24} color={p.deep} />
            </Pressable>
          </View>
          <Field
            label={`البحث في ${title}`}
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو الكود…"
            autoCorrect={false}
          />
          {!!error && (
            <View style={s.alert}>
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
              <Button title="إعادة تحميل الخيارات" onPress={onRetry} secondary />
            </View>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(row) => row.key}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`اختيار ${item.title}`}
                disabled={item.disabled}
                onPress={() => onSelect(item.key)}
                style={[s.pickerRow, item.disabled && s.disabled]}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={s.photo} />
                ) : (
                  <Icon name="plus-circle-outline" color={p.primary} size={26} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{item.title}</Text>
                  <Text style={s.caption}>{item.caption}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={s.caption}>
                {loading ? 'جارٍ تحميل الخيارات…' : 'لا توجد نتائج مطابقة'}
              </Text>
            }
            ListFooterComponent={loading ? <ActivityIndicator color={p.primary} /> : null}
          />
        </View>
      </View>
    </Modal>
  );
}
