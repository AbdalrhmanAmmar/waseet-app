import { useCallback, useRef, useState } from 'react';
import { Modal, RefreshControl, ScrollView, View } from 'react-native';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import Header from '@/components/shared/HeaderComponent';
import ScreenContainer from '@/components/shared/ScreenContainer';
import { Button } from '@/components/shared/ui';
import {
  MerchantBadge,
  MerchantDetailRow,
  MerchantNotice,
  MerchantState,
  m,
} from '@/components/merchant/workspace';
import {
  useMerchantEmployeeQuery,
  useMerchantEmployeeActionMutation,
  useVerifyMerchantEmployeeActionMutation,
} from '@/api/merchant/employees';
import type { EmployeeActionError } from '@/api/merchant/employee-guards';
import { API_URL } from '@/config/env';
import { merchantAccess } from '@/domain/merchant-access';
import {
  employeeActionAllowed,
  employeeActionCopy,
  employeePresentation,
  type EmployeeAction,
  type MerchantEmployee,
} from '@/domain/employee-management';
import { merchantDisplayDate } from '@/domain/merchant-finance';
import { useSession } from '@/hooks/shared/use-session';
import { errorMessage } from '@/api/normalizers';
import { palette as p } from '@/theme/tokens';
export default function EmployeeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const employeeId = typeof id === 'string' && /^\d+$/.test(id) ? id : '';
  const { userData } = useSession();
  const merchantId = String(userData?.userId ?? '');
  const allowed = merchantAccess(userData, merchantId);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [action, setAction] = useState<EmployeeAction | null>(null);
  const [reviewed, setReviewed] = useState<MerchantEmployee | null>(null);
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const query = useMerchantEmployeeQuery(
    { merchantId, employeeId },
    { skip: !allowed || !employeeId, refetchOnMountOrArgChange: true },
  );
  const [send, result] = useMerchantEmployeeActionMutation({
    fixedCacheKey: `employee-${API_URL}-${merchantId}-${employeeId}`,
  });
  const [verify, verification] = useVerifyMerchantEmployeeActionMutation();
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (allowed && employeeId) void refetch();
    }, [allowed, employeeId, refetch]),
  );
  const employee = query.currentData;
  const failure = result.error as EmployeeActionError | undefined;
  const uncertain = failure?.status === 'EMPLOYEE_UNCERTAIN';
  const busy = result.isLoading || verification.isLoading;
  const finish = (completed: EmployeeAction) => {
    setAction(null);
    result.reset();
    verification.reset();
    if (completed === 'delete')
      router.dismissTo({ pathname: '/merchant/employees', params: { notice: 'deleted' } });
    else {
      setNotice(employeeActionCopy[completed].success);
      void refetch();
    }
  };
  const confirm = async () => {
    if (lock.current || busy || uncertain || !action || !reviewed) return;
    lock.current = true;
    try {
      await send({ merchantId, employeeId, action, expectedStatus: reviewed.status }).unwrap();
      finish(action);
    } catch {
      /* The mutation error stays visible and is retained across navigation. */
    } finally {
      lock.current = false;
    }
  };
  const verifyResult = async () => {
    if (lock.current || busy || !failure?.targetAction) return;
    lock.current = true;
    try {
      await verify({ merchantId, employeeId, action: failure.targetAction }).unwrap();
      finish(failure.targetAction);
    } catch {
      /* Verification is read-only; do not repeat the original write. */
    } finally {
      lock.current = false;
    }
  };
  const back = () => {
    if (!busy) {
      router.dismissTo('/merchant/employees');
    }
  };
  if (!allowed) return <Redirect href="/" />;
  return (
    <ScreenContainer backgroundColor={p.background} edges={['top', 'bottom']}>
      <Header title="تفاصيل الموظف" onBack={back} />
      <ScrollView
        contentContainerStyle={m.page}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !!employee}
            onRefresh={() => {
              if (employeeId && !busy) void refetch();
            }}
            tintColor={p.primary}
          />
        }
      >
        {!!notice && <MerchantNotice text={notice} />}
        {query.isError && !uncertain && <MerchantNotice error text={errorMessage(query.error)} />}
        {uncertain && (
          <>
            <MerchantNotice error text={failure.message} />
            <Button
              title="التحقق من نتيجة الإجراء"
              loading={verification.isLoading}
              onPress={() => void verifyResult()}
            />
            {verification.isError && (
              <MerchantNotice
                error
                text="لم تتأكد النتيجة بعد. حدّث للتحقق لاحقًا أو تواصل مع الدعم قبل تنفيذ إجراء جديد."
              />
            )}
          </>
        )}
        {!employee ? (
          <MerchantState
            loading={query.isFetching}
            error={query.isError}
            title="بيانات الموظف غير متاحة"
            description="تظهر هنا تفاصيل الموظفين التابعين لمتجرك فقط."
            action={employeeId ? 'إعادة المحاولة' : 'العودة إلى الموظفين'}
            onAction={() => (employeeId ? void refetch() : router.replace('/merchant/employees'))}
          />
        ) : (
          <>
            <View style={[m.hero, { alignItems: 'center', paddingVertical: 28 }]}>
              <View
                style={[
                  m.avatar,
                  { height: 76, width: 76, borderRadius: 26, backgroundColor: '#fff' },
                ]}
              >
                <Text style={[m.initial, { fontSize: 35 }]}>{employee.name[0]}</Text>
              </View>
              <Text style={[m.heading, { textAlign: 'center' }]}>{employee.name}</Text>
              <Text
                selectable
                style={[m.caption, { writingDirection: 'ltr', textAlign: 'center' }]}
              >
                {employee.email ?? 'البريد غير متاح'}
              </Text>
              <View style={{ alignSelf: 'center' }}>
                <MerchantBadge {...employeePresentation(employee.status)} />
              </View>
              <Text style={m.caption}>موظف تاجر · تابع لمتجرك</Text>
            </View>
            <View style={m.card}>
              <Text style={m.sectionTitle}>بيانات الموظف</Text>
              <MerchantDetailRow label="الاسم" value={employee.name} />
              <MerchantDetailRow label="البريد الإلكتروني" value={employee.email} ltr />
              <MerchantDetailRow label="رقم الهاتف" value={employee.phone} ltr />
              <MerchantDetailRow
                label="تاريخ الإنشاء"
                value={merchantDisplayDate(employee.createdAt, true)}
              />
              <MerchantDetailRow
                label="التاجر"
                value={
                  [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') ||
                  'حسابك الحالي'
                }
              />
            </View>
            <View style={m.card}>
              <Text style={m.sectionTitle}>إدارة الحساب</Text>
              <Text style={m.caption}>راجع الموظف والإجراء قبل تأكيد أي تغيير.</Text>
              {(['Approved', 'Rejected'] as const)
                .filter((target) => employeeActionAllowed(employee, target))
                .map((target) => (
                  <Button
                    key={target}
                    title={target === 'Approved' ? 'الموافقة على الموظف' : 'رفض الموظف'}
                    icon={
                      target === 'Approved' ? 'account-check-outline' : 'account-cancel-outline'
                    }
                    secondary={target === 'Rejected'}
                    disabled={busy || uncertain || query.isFetching || query.isError}
                    onPress={() => {
                      result.reset();
                      verification.reset();
                      setNotice('');
                      setReviewed(employee);
                      setAction(target);
                    }}
                  />
                ))}
              {!['pending', 'approved', 'rejected'].includes(
                employee.status.trim().toLowerCase(),
              ) && (
                <MerchantNotice text="لا توجد إجراءات موافقة أو رفض متاحة لهذه الحالة حاليًا." />
              )}
            </View>
            <View style={[m.card, { borderColor: '#EEDBD7' }]}>
              <View style={m.row}>
                <Text style={m.sectionTitle}>حذف الموظف</Text>
                <Icon name="account-remove-outline" size={25} color={p.danger} />
              </View>
              <Text style={m.caption}>راجع اسم الموظف وبريده جيدًا قبل إرسال طلب حذف الحساب.</Text>
              <Button
                title="حذف الموظف"
                secondary
                disabled={busy || uncertain || query.isFetching || query.isError}
                onPress={() => {
                  result.reset();
                  verification.reset();
                  setNotice('');
                  setReviewed(employee);
                  setAction('delete');
                }}
              />
            </View>
          </>
        )}
        <Button title="العودة إلى الموظفين" secondary disabled={busy} onPress={back} />
      </ScrollView>
      <Modal
        visible={!!action}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setAction(null);
        }}
      >
        <View style={m.backdrop}>
          <View style={m.sheet} accessibilityViewIsModal>
            <View style={m.handle} />
            <ScrollView
              contentContainerStyle={[
                m.page,
                { paddingBottom: Math.max(insets.bottom, 24), alignItems: 'stretch' },
              ]}
            >
              <View
                style={[
                  m.emptyIcon,
                  {
                    alignSelf: 'center',
                    backgroundColor: action === 'Approved' ? p.soft : '#FBECEC',
                  },
                ]}
              >
                <Icon
                  name={
                    action === 'Approved'
                      ? 'account-check-outline'
                      : action === 'delete'
                        ? 'trash-can-outline'
                        : 'account-cancel-outline'
                  }
                  size={36}
                  color={action === 'Approved' ? p.primary : p.danger}
                />
              </View>
              <Text accessibilityRole="header" style={[m.heading, { textAlign: 'center' }]}>
                {action ? employeeActionCopy[action].title : ''}
              </Text>
              <View style={m.card}>
                <Text style={[m.sectionTitle, { textAlign: 'center' }]}>{reviewed?.name}</Text>
                <Text style={[m.caption, { textAlign: 'center', writingDirection: 'ltr' }]}>
                  {reviewed?.email}
                </Text>
              </View>
              <Text style={[m.body, { textAlign: 'center' }]}>
                {action ? employeeActionCopy[action].description : ''}
              </Text>
              {failure && <MerchantNotice error text={failure.message} />}
              {uncertain ? (
                <Button
                  title="التحقق من نتيجة الإجراء"
                  loading={verification.isLoading}
                  onPress={() => void verifyResult()}
                />
              ) : (
                <Button
                  title={action ? employeeActionCopy[action].confirm : 'تأكيد'}
                  loading={busy}
                  disabled={!employee}
                  style={action !== 'Approved' ? { backgroundColor: p.danger } : undefined}
                  onPress={() => void confirm()}
                />
              )}
              {verification.isError && (
                <MerchantNotice
                  error
                  text="تعذر تأكيد النتيجة. يمكنك التحقق مجددًا دون إعادة إرسال الإجراء."
                />
              )}
              <Button
                title={action === 'delete' ? 'إلغاء' : 'رجوع'}
                secondary
                disabled={busy}
                onPress={() => setAction(null)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
