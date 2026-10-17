import { useRef, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { deleteOwnAccount } from '@/store/delete-account';
import type { ApiError } from '@/types/models';
import Text from '../CustomText';
import { Button, Card, ui } from '../ui';
import { palette as p } from '@/theme/tokens';
export function DeleteAccount() {
  const { userData } = useSession();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const close = () => {
    if (!lock.current) setOpen(false);
  };
  const remove = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await dispatch(deleteOwnAccount()).unwrap();
    } catch (caught) {
      const failure = caught as ApiError;
      setError(
        typeof failure.status !== 'number' || failure.status >= 500
          ? 'تعذر التأكد من نتيجة الحذف. تحقق من حالة حسابك قبل إعادة المحاولة؛ لم نكرر الطلب تلقائيًا.'
          : failure.status === 403
            ? 'الخادم لا يسمح بحذف هذا الحساب حاليًا. تواصل مع الدعم.'
            : failure.message || 'تعذر حذف الحساب',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (!userData) return null;
  return (
    <>
      <Button
        title="حذف حسابي"
        icon="account-remove-outline"
        secondary
        onPress={() => {
          setError('');
          setOpen(true);
        }}
      />
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }}>
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingVertical: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Card>
              <Text accessibilityRole="header" style={[ui.title, { color: p.danger }]}>
                تأكيد حذف الحساب
              </Text>
              <Text>
                أنت على وشك حذف حسابك. لا يمكن التراجع عن هذا الإجراء من التطبيق، وسيتم تسجيل خروجك
                بعد نجاح الحذف.
              </Text>
              <Text style={ui.caption}>
                قد تُحتفظ بسجلات لازمة وفق سياسة الخصوصية. حذف الحساب لا يؤكد تسوية أرصدة أو طلبات
                قائمة.
              </Text>
              <Text style={ui.caption}>{userData.email || `حساب #${userData.userId}`}</Text>
              {!!error && (
                <Text accessibilityRole="alert" style={{ color: p.danger }}>
                  {error}
                </Text>
              )}
              <Button title="إلغاء والاحتفاظ بحسابي" secondary disabled={busy} onPress={close} />
              <Button
                title="تأكيد حذف حسابي"
                loading={busy}
                disabled={busy}
                style={{ backgroundColor: p.danger }}
                onPress={() => void remove()}
              />
            </Card>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
