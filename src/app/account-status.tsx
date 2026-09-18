import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { GetUserProfile, logout } from '@/store/slices/auth';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
export default function AccountStatus() {
  const { userData } = useSession();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>حالة الحساب</Text>
      <Text style={styles.text}>
        حسابك غير مفعّل حاليًا. الحالة: {userData?.accountStatus ?? userData?.status}
      </Text>
      <Text style={styles.text}>يمكنك تحديث الحالة بعد مراجعة الإدارة.</Text>
      {!!error && <Text>{error}</Text>}
      <Pressable
        disabled={busy}
        style={styles.button}
        onPress={async () => {
          if (!userData) return;
          setBusy(true);
          setError('');
          try {
            await dispatch(GetUserProfile(userData.userId)).unwrap();
          } catch {
            setError('تعذر تحديث الحالة. حاول مرة أخرى.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.white}>{busy ? 'جارٍ التحديث...' : 'تحديث الحالة'}</Text>
      </Pressable>
      <Pressable onPress={() => dispatch(logout())}>
        <Text style={styles.text}>تسجيل الخروج</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 20,
    backgroundColor: '#F5F6FA',
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  text: { textAlign: 'center', lineHeight: 24 },
  button: { padding: 16, borderRadius: 12, backgroundColor: '#E65317' },
  white: { color: '#fff' },
});
