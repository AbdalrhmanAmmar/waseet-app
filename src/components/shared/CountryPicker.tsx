import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import Text from './CustomText';
import ScreenContainer from './ScreenContainer';
import { palette, typography } from '@/theme/tokens';
import countries from 'world-countries';
export type CountryCode = string;
export interface Country {
  cca2: string;
  name: string;
  callingCode: string[];
}
const items: Country[] = countries
  .map((country) => ({
    cca2: country.cca2,
    name: country.translations.ara?.common ?? country.name.common,
    callingCode: [
      (country.idd.root ?? '').replace('+', '') +
        (country.idd.suffixes?.length === 1 ? country.idd.suffixes[0] : ''),
    ],
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
interface Props {
  theme?: { fontFamily?: string; fontSize?: number };
  countryCode?: string;
  visible?: boolean;
  onClose?: () => void;
  onSelect: (country: Country) => void;
  withFilter?: boolean;
  withFlag?: boolean;
  withCallingCode?: boolean;
  withCountryNameButton?: boolean;
  withEmoji?: boolean;
  withCallingCodeButton?: boolean;
  renderFlagButton?: () => React.ReactNode;
}
export default function CountryPicker({
  countryCode = 'SY',
  visible,
  onClose,
  onSelect,
  renderFlagButton,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');
  const close = () => {
    setOpened(false);
    onClose?.();
  };
  return (
    <>
      {renderFlagButton ? (
        renderFlagButton()
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="اختيار الدولة"
          onPress={() => setOpened(true)}
        >
          <Text style={styles.code}>{countryCode} ▾</Text>
        </Pressable>
      )}
      <Modal
        visible={visible ?? opened}
        animationType={reducedMotion ? 'none' : 'slide'}
        onRequestClose={close}
      >
        <ScreenContainer edges={['top', 'bottom']} style={styles.container}>
          <Pressable accessibilityRole="button" onPress={close}>
            <Text style={styles.code}>إغلاق</Text>
          </Pressable>
          <TextInput
            accessibilityLabel="البحث عن دولة"
            placeholder="ابحث عن دولة"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
          <FlatList
            data={items.filter((item) =>
              `${item.name} ${item.cca2}`.toLowerCase().includes(search.toLowerCase()),
            )}
            keyExtractor={(item) => item.cca2}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  close();
                }}
              >
                <Text>
                  {item.name} (+{item.callingCode[0]})
                </Text>
              </Pressable>
            )}
          />
        </ScreenContainer>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  search: {
    borderWidth: 1,
    borderColor: palette.border,
    fontFamily: typography.regular,
    fontSize: 16,
    backgroundColor: palette.surface,
    color: palette.ink,
    borderRadius: 12,
    padding: 14,
    textAlign: 'right',
  },
  row: { padding: 18, borderBottomWidth: 1, borderColor: '#eee' },
  code: { padding: 12, color: '#147D64' },
});
