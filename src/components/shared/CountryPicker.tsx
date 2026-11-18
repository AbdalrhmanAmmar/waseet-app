import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { asciiDigits, countryFlag } from '@/domain/auth-inputs';
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
  renderTrigger?: (open: () => void) => React.ReactNode;
  title?: string;
  disabled?: boolean;
  callingCodesOnly?: boolean;
}
export default function CountryPicker({
  countryCode = 'SY',
  visible,
  onClose,
  onSelect,
  renderFlagButton,
  renderTrigger,
  title = 'اختيار الدولة',
  disabled = false,
  callingCodesOnly = false,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');
  const close = () => {
    setOpened(false);
    onClose?.();
  };
  const open = () => {
    if (!disabled) {
      Keyboard.dismiss();
      setSearch('');
      setOpened(true);
    }
  };
  const term = asciiDigits(search).trim().toLowerCase().replace(/[أإآ]/g, 'ا');
  return (
    <>
      {renderTrigger ? (
        renderTrigger(open)
      ) : renderFlagButton ? (
        renderFlagButton()
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="اختيار الدولة"
          onPress={open}
          disabled={disabled}
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
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق اختيار الدولة"
              onPress={close}
              style={styles.close}
            >
              <Icon name="close" size={23} color={palette.primary} />
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="البحث عن دولة"
            placeholder="ابحث عن دولة"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            placeholderTextColor={palette.muted}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <FlatList
            data={items.filter(
              (item) =>
                (!callingCodesOnly || !!item.callingCode[0]) &&
                `${item.name} ${item.cca2} +${item.callingCode[0]}`
                  .toLowerCase()
                  .replace(/[أإآ]/g, 'ا')
                  .includes(term),
            )}
            keyExtractor={(item) => item.cca2}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={<Text style={styles.empty}>لا توجد دولة مطابقة للبحث.</Text>}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name} (+${item.callingCode[0]})`}
                accessibilityState={{ selected: item.cca2 === countryCode }}
                style={styles.row}
                onPress={() => {
                  if (!disabled) {
                    onSelect(item);
                    close();
                  }
                }}
              >
                <Text accessible={false} style={styles.flag}>
                  {countryFlag(item.cca2)}
                </Text>
                <Text style={{ flex: 1 }}>{item.name}</Text>
                {!!item.callingCode[0] && (
                  <Text style={styles.callingCode}>+{item.callingCode[0]}</Text>
                )}
                {item.cca2 === countryCode && (
                  <Icon name="check-circle" color={palette.primary} size={21} />
                )}
              </Pressable>
            )}
          />
        </ScreenContainer>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, gap: 16, backgroundColor: palette.background },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    gap: 12,
  },
  title: { flex: 1, fontFamily: typography.bold, fontSize: 21, lineHeight: 31 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    minHeight: 56,
  },
  row: {
    paddingVertical: 16,
    minHeight: 64,
    gap: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: palette.border,
  },
  flag: { fontSize: 24 },
  callingCode: { color: palette.muted, writingDirection: 'ltr' },
  empty: { paddingVertical: 30, color: palette.muted, textAlign: 'center' },
  code: { padding: 12, color: '#147D64' },
});
