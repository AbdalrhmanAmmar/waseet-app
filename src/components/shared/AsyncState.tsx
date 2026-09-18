import { errorMessage } from '@/api/normalizers';
import { COLORS } from '@/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.box}>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <Text style={styles.text}>{error ? errorMessage(error) : empty}</Text>
      )}
      {!!error && onRetry && (
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <Text style={styles.retry}>إعادة المحاولة</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  box: { padding: 24, alignItems: 'center', gap: 12 },
  text: { textAlign: 'center', color: '#525C67' },
  retry: { color: COLORS.primary, padding: 10 },
});
