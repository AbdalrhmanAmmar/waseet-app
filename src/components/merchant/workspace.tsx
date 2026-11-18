import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { Button } from '@/components/shared/ui';
import { palette as p, typography as t } from '@/theme/tokens';
export function MerchantBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'pending' | 'danger' | 'neutral';
}) {
  const colors = {
    success: ['#E7F5ED', '#167450'],
    pending: ['#FFF0DE', '#996018'],
    danger: ['#FBECEC', p.danger],
    neutral: ['#EFF2F0', p.muted],
  }[tone];
  return (
    <View style={[m.badge, { backgroundColor: colors[0] }]}>
      <View style={[m.dot, { backgroundColor: colors[1] }]} />
      <Text style={[m.badgeText, { color: colors[1] }]}>{label}</Text>
    </View>
  );
}
export function MerchantChips({
  items,
  selected,
  onSelect,
  label,
}: {
  items: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  label: string;
}) {
  return (
    <View style={m.chips}>
      {items.map((item) => (
        <Pressable
          key={item.value}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${item.label}`}
          accessibilityState={{ selected: selected === item.value }}
          onPress={() => onSelect(item.value)}
          style={[m.chip, selected === item.value && m.activeChip]}
        >
          <Text style={[m.chipText, selected === item.value && { color: '#fff' }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function MerchantNotice({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <View style={[m.notice, error && { backgroundColor: '#FBEFEF', borderColor: '#F0D5D5' }]}>
      <Icon
        name={error ? 'alert-circle-outline' : 'information-outline'}
        size={20}
        color={error ? p.danger : p.primary}
      />
      <Text
        accessibilityRole={error ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
        style={[m.caption, { flex: 1 }, error && { color: p.danger }]}
      >
        {text}
      </Text>
    </View>
  );
}
export function MerchantState({
  loading,
  title,
  description,
  action,
  onAction,
  error,
}: {
  loading?: boolean;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  error?: boolean;
}) {
  if (loading)
    return (
      <View
        accessibilityLabel="جارٍ التحميل"
        accessibilityState={{ busy: true }}
        style={{ gap: 14, paddingVertical: 16 }}
      >
        <ActivityIndicator color={p.primary} />
        {[1, 2, 3].map((key) => (
          <View key={key} style={m.skeleton}>
            <View style={[m.skeletonLine, { width: '60%' }]} />
            <View style={[m.skeletonLine, { width: '85%' }]} />
            <View style={[m.skeletonLine, { width: '35%' }]} />
          </View>
        ))}
      </View>
    );
  return (
    <View style={m.empty}>
      <View style={m.emptyIcon}>
        <Icon
          name={error ? 'cloud-alert-outline' : 'inbox-outline'}
          size={34}
          color={error ? p.danger : p.primary}
        />
      </View>
      <Text style={[m.sectionTitle, { textAlign: 'center' }]}>{title}</Text>
      {description && <Text style={[m.caption, { textAlign: 'center' }]}>{description}</Text>}
      {action && onAction && (
        <Button title={action} onPress={onAction} secondary style={{ alignSelf: 'stretch' }} />
      )}
    </View>
  );
}
export function MerchantDetailRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value?: string | null;
  ltr?: boolean;
}) {
  return (
    <View style={m.detailRow}>
      <Text style={m.caption}>{label}</Text>
      <Text selectable style={[m.body, ltr && { writingDirection: 'ltr' }]}>
        {value || 'غير متاح'}
      </Text>
    </View>
  );
}
export function MerchantIconButton({
  name,
  label,
  onPress,
  disabled,
}: {
  name: ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[m.iconButton, disabled && { opacity: 0.45 }]}
    >
      <Icon name={name} size={23} color={p.primary} />
    </Pressable>
  );
}
export const m = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 32,
    gap: 18,
    flexGrow: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: { fontFamily: t.bold, fontSize: 26, lineHeight: 38, color: p.deep, textAlign: 'right' },
  sectionTitle: {
    fontFamily: t.bold,
    fontSize: 19,
    lineHeight: 29,
    color: p.deep,
    textAlign: 'right',
  },
  body: { fontFamily: t.medium, fontSize: 15, lineHeight: 25, color: p.ink, textAlign: 'right' },
  caption: { fontSize: 13, lineHeight: 22, color: p.muted, textAlign: 'right' },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 22,
    padding: 18,
    gap: 14,
    boxShadow: '0px 4px 18px rgba(16, 62, 50, 0.035)',
  },
  hero: {
    borderRadius: 24,
    padding: 22,
    gap: 12,
    backgroundColor: p.soft,
    borderWidth: 1,
    borderColor: '#DAEADD',
  },
  heroIcon: {
    height: 46,
    width: 46,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  money: {
    fontSize: 24,
    lineHeight: 35,
    fontFamily: t.bold,
    color: p.deep,
    textAlign: 'right',
    writingDirection: 'ltr',
  },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, paddingVertical: 3 },
  chip: {
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 24,
    paddingHorizontal: 15,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  activeChip: { backgroundColor: p.primary, borderColor: p.primary },
  chipText: { fontFamily: t.bold, fontSize: 13, color: p.muted },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    maxWidth: '100%',
  },
  badgeText: { fontFamily: t.bold, fontSize: 12, lineHeight: 20, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  iconButton: {
    minWidth: 46,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: p.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingVertical: 12,
    fontFamily: t.regular,
    fontSize: 15,
    color: p.ink,
    textAlign: 'right',
  },
  notice: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 9,
    padding: 14,
    borderRadius: 15,
    backgroundColor: p.soft,
    borderWidth: 1,
    borderColor: p.border,
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 18,
    backgroundColor: p.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: p.primary, fontSize: 23, fontFamily: t.bold },
  detailRow: { gap: 4, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EEF2EE' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 30, paddingHorizontal: 10 },
  emptyIcon: {
    backgroundColor: p.soft,
    borderRadius: 25,
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: p.border,
    padding: 20,
    backgroundColor: '#fff',
    gap: 15,
    alignItems: 'flex-end',
  },
  skeletonLine: { borderRadius: 6, height: 13, backgroundColor: '#ECF1ED' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#092C2470' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: p.background,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#CCD9D0',
    marginTop: 12,
  },
});
