import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Text from './CustomText';
import { palette as p, typography as t } from '@/theme/tokens';
import Images from '@/theme/images';
export function Button({
  title,
  onPress,
  loading,
  disabled,
  secondary,
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  icon?: React.ComponentProps<typeof Icon>['name'];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? p.primary : '#fff'} />
      ) : (
        <>
          <Text style={[ui.buttonText, secondary && { color: p.primary }]}>{title}</Text>
          {icon && <Icon name={icon} size={20} color={secondary ? p.primary : '#fff'} />}
        </>
      )}
    </Pressable>
  );
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={ui.brand}>
      <Image
        source={Images.brandLogo}
        style={{ width: compact ? 42 : 56, height: compact ? 42 : 56 }}
        accessibilityLabel="شعار وسيط"
      />
      <View>
        <Text style={ui.brandName}>وسيط</Text>
        {!compact && <Text style={ui.caption}>تجارتك، بخطوات أبسط</Text>}
      </View>
    </View>
  );
}
export function SectionTitle({
  title,
  subtitle,
  action,
  onPress,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={ui.section}>
      <View style={{ flex: 1 }}>
        <Text style={ui.title}>{title}</Text>
        {subtitle && <Text style={ui.caption}>{subtitle}</Text>}
      </View>
      {action && (
        <Pressable accessibilityRole="button" onPress={onPress} style={{ padding: 8 }}>
          <Text style={ui.link}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[ui.card, style]}>{children}</View>;
}
export const ui = StyleSheet.create({
  page: { padding: 20, gap: 20, paddingBottom: 32 },
  card: {
    backgroundColor: p.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: p.border,
    gap: 12,
  },
  section: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontFamily: t.bold, fontSize: 21, lineHeight: 30, color: p.ink },
  caption: { color: p.muted, fontSize: 13, lineHeight: 21 },
  link: { color: p.primary, fontFamily: t.bold, fontSize: 14 },
  button: {
    backgroundColor: p.primary,
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: { color: '#fff', fontFamily: t.bold, fontSize: 16 },
  secondary: { backgroundColor: p.soft, borderWidth: 1, borderColor: p.border },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 26, lineHeight: 34, fontFamily: t.bold },
});
