import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { useMerchantWithdrawalsQuery } from '@/api/merchant/withdrawals';
import { useSession } from '@/hooks/shared/use-session';
import { merchantAccess } from '@/domain/merchant-access';
import { merchantDisplayDate, withdrawalPresentation } from '@/domain/merchant-finance';
import { formatBalance } from '@/domain/balance';
import { errorMessage } from '@/api/normalizers';
import { palette as p } from '@/theme/tokens';
export default function WithdrawalDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userData } = useSession();
  const merchantId = String(userData?.userId ?? '');
  const allowed = merchantAccess(userData, merchantId);
  const query = useMerchantWithdrawalsQuery(
    { merchantId },
    { skip: !allowed, refetchOnMountOrArgChange: true },
  );
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (allowed) void refetch();
    }, [allowed, refetch]),
  );
  const record = query.currentData?.find((item) => item.id === id);
  if (!allowed) return <Redirect href="/" />;
  return (
    <ScreenContainer edges={['top', 'bottom']} backgroundColor={p.background}>
      <Header title="تفاصيل طلب السحب" />
      <ScrollView
        contentContainerStyle={m.page}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !!query.currentData}
            onRefresh={() => void refetch()}
            tintColor={p.primary}
          />
        }
      >
        {query.isError && <MerchantNotice error text={errorMessage(query.error)} />}
        {!record ? (
          <MerchantState
            loading={query.isFetching}
            error={query.isError}
            title={query.isError ? 'تعذر تحميل الطلب' : 'طلب السحب غير متاح'}
            description="تظهر هنا طلبات السحب التابعة لحسابك فقط."
            action="إعادة المحاولة"
            onAction={() => void refetch()}
          />
        ) : (
          <>
            <View style={[m.hero, { alignItems: 'center', paddingVertical: 28 }]}>
              <View style={m.heroIcon}>
                <Icon name="bank-transfer-out" color={p.primary} size={31} />
              </View>
              <Text style={m.caption}>طلب السحب #{record.id}</Text>
              <Text style={[m.money, { fontSize: 34, lineHeight: 46 }]}>
                {record.amount === null ? 'غير متاح' : `${formatBalance(record.amount)} USD`}
              </Text>
              <View style={{ alignSelf: 'center' }}>
                <MerchantBadge {...withdrawalPresentation(record.status)} />
              </View>
            </View>
            <View style={m.card}>
              <Text style={m.sectionTitle}>بيانات الطلب</Text>
              <MerchantDetailRow
                label="تاريخ تقديم الطلب"
                value={merchantDisplayDate(record.requestedAt, true)}
              />
              <MerchantDetailRow
                label="تاريخ المعالجة"
                value={merchantDisplayDate(record.resolvedAt, true)}
              />
              <MerchantDetailRow label="ملاحظتك" value={record.note} />
              <MerchantDetailRow label="ملاحظة الإدارة" value={record.adminNote} />
            </View>
            <View style={m.card}>
              <Text style={m.sectionTitle}>متابعة الطلب</Text>
              {[
                { title: 'تقديم الطلب', date: record.requestedAt, done: true },
                { title: 'مراجعة الإدارة', date: record.resolvedAt, done: !!record.resolvedAt },
              ].map((step) => (
                <View
                  key={step.title}
                  style={[m.row, { justifyContent: 'flex-start', paddingVertical: 6 }]}
                >
                  <View style={[m.avatar, { backgroundColor: step.done ? p.soft : '#F2F3F0' }]}>
                    <Icon
                      name={step.done ? 'check-circle-outline' : 'clock-outline'}
                      size={26}
                      color={step.done ? p.primary : p.muted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={m.body}>{step.title}</Text>
                    <Text style={m.caption}>
                      {step.done
                        ? merchantDisplayDate(step.date, true)
                        : 'بانتظار تحديث حالة المعالجة'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <MerchantNotice text="تعرض هذه الصفحة حالة طلب السحب. الموافقة وحدها لا تؤكد وصول الأموال؛ إجمالي المبلغ المسحوب يؤخذ من بيانات حسابك." />
          </>
        )}
        <Button
          title="العودة إلى سجل السحوبات"
          secondary
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/merchant/withdrawals')
          }
        />
      </ScrollView>
    </ScreenContainer>
  );
}
