import { errorMessage } from '@/api/normalizers';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from './CustomText';
import { Button } from './ui';
import { palette as p } from '@/theme/tokens';
export function AsyncState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: string;
  onRetry?: () => void;
}) {
  if (!loading && !error && !empty) return null;
  return (
    <View style={s.box}>
      {loading ? (
        <ActivityIndicator color={p.primary} />
      ) : (
        <>
          <View style={s.icon}>
            <Icon name={error ? 'wifi-alert' : 'tray-arrow-down'} size={28} color={p.muted} />
          </View>
          <Text accessibilityRole={error ? 'alert' : undefined} style={s.text}>
            {error ? errorMessage(error) : empty}
          </Text>
        </>
      )}
      {!!error && onRetry && <Button title="إعادة المحاولة" onPress={onRetry} secondary />}
    </View>
  );
}
const s = StyleSheet.create({
  box: { padding: 24, alignItems: 'center', gap: 14 },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: p.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { textAlign: 'center', color: p.muted },
});
