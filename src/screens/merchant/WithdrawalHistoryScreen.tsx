import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Header from '@/components/shared/HeaderComponent';
import { Button } from '@/components/shared/ui';
import {
  MerchantBadge,
  MerchantChips,
  MerchantIconButton,
  MerchantNotice,
  MerchantState,
  m,
} from '@/components/merchant/workspace';
import { useMerchantWithdrawalsQuery } from '@/api/merchant/withdrawals';
import { merchantAccess } from '@/domain/merchant-access';
import {
  financeStatusKey,
  merchantDisplayDate,
  withdrawalFilterError,
  withdrawalPresentation,
  withdrawalStatuses,
  withdrawalTotal,
  type WithdrawalFilters,
} from '@/domain/merchant-finance';
import { formatBalance } from '@/domain/balance';
import { useSession } from '@/hooks/shared/use-session';
import { errorMessage } from '@/api/normalizers';
import { palette as p } from '@/theme/tokens';

const dateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export default function WithdrawalHistoryScreen() {
  const { userData } = useSession();
  const merchantId = String(userData?.userId ?? '');
  const allowed = merchantAccess(userData, merchantId);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<WithdrawalFilters>({});
  const [period, setPeriod] = useState('كل الفترات');
  const [datesOpen, setDatesOpen] = useState(false);
  const [draft, setDraft] = useState({ fromDate: '', toDate: '' });
  const [dateError, setDateError] = useState('');
  const query = useMerchantWithdrawalsQuery(
    { merchantId, ...filters },
    { skip: !allowed, refetchOnMountOrArgChange: true },
  );
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (allowed) void refetch();
    }, [allowed, refetch]),
  );
  const records = query.currentData ?? [];
  const summaryItems =
    !filters.status || filters.status === 'Pending'
      ? records.filter((item) => financeStatusKey(item.status) === 'pending')
      : records;
  const total = withdrawalTotal(summaryItems);
  const applyPeriod = (fromDate: string, toDate: string, label: string) => {
    const invalid = withdrawalFilterError({ fromDate, toDate });
    if (invalid) {
      setDateError(invalid);
      return;
    }
    setFilters((current) => ({
      ...current,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }));
    setPeriod(label);
    setDatesOpen(false);
    setDateError('');
  };
  if (!allowed) return <Redirect href="/" />;
  return (
    <ScreenContainer backgroundColor={p.background}>
      <Header
        title="سجل السحوبات"
        rightComponent={
          <MerchantIconButton
            name="refresh"
            label="تحديث سجل السحوبات"
            disabled={query.isFetching}
            onPress={() => void refetch()}
          />
        }
      />
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[m.page, { paddingBottom: Math.max(insets.bottom, 24) }]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !!query.currentData}
            onRefresh={() => void refetch()}
            tintColor={p.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 18 }}>
            <Text style={m.caption}>طلبات السحب وقرارات مراجعتها، الأحدث أولًا.</Text>
            <View style={[m.hero, { padding: 18, gap: 8 }]}>
              <View style={m.row}>
                <View style={{ flex: 1 }}>
                  <Text style={m.caption}>
                    {!filters.status || filters.status === 'Pending'
                      ? 'قيد المراجعة ضمن النتائج'
                      : 'قيمة الطلبات المعروضة'}
                  </Text>
                  <Text style={m.money}>
                    {query.isFetching || query.isError || total === null
                      ? '—'
                      : `${formatBalance(total)} USD`}
                  </Text>
                </View>
                <View style={m.heroIcon}>
                  <Icon name="bank-transfer-out" size={29} color={p.primary} />
                </View>
              </View>
              <Text style={m.caption}>
                {query.isError
                  ? 'تعذر تأكيد أحدث بيانات السجل'
                  : query.isFetching
                    ? 'جارٍ التحقق من أحدث بيانات السجل'
                    : `عدد الطلبات: ${records.length} · ${period}`}
              </Text>
            </View>
            <MerchantChips
              items={withdrawalStatuses}
              selected={filters.status ?? ''}
              label="حالة السحب"
              onSelect={(status) =>
                setFilters((current) => ({ ...current, status: status || undefined }))
              }
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تحديد فترة السحوبات"
              onPress={() => {
                setDraft({ fromDate: filters.fromDate ?? '', toDate: filters.toDate ?? '' });
                setDateError('');
                setDatesOpen(true);
              }}
              style={[m.card, m.row, { paddingVertical: 12 }]}
            >
              <View style={[m.row, { justifyContent: 'flex-start', flex: 1 }]}>
                <Icon name="calendar-range" size={22} color={p.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={m.body}>{period}</Text>
                  {(filters.fromDate || filters.toDate) && (
                    <Text style={m.caption}>
                      {filters.fromDate || 'من البداية'} — {filters.toDate || 'حتى الآن'}
                    </Text>
                  )}
                </View>
              </View>
              <Icon name="chevron-down" size={22} color={p.muted} />
            </Pressable>
            <Button
              title="طلب سحب جديد"
              icon="plus"
              onPress={() => router.push('/merchant/withdrawal')}
            />
            {query.isError && <MerchantNotice error text={errorMessage(query.error)} />}
            {query.isError && !!records.length && (
              <Button title="إعادة تحميل السجل" secondary onPress={() => void refetch()} />
            )}
            <View style={m.row}>
              <Text style={m.sectionTitle}>طلبات السحب</Text>
              <Text style={m.caption}>
                {query.isFetching ? 'جارٍ التحديث…' : `${records.length} طلبات`}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`تفاصيل طلب السحب ${item.id}`}
            onPress={() =>
              router.push({ pathname: '/merchant/withdrawal-details', params: { id: item.id } })
            }
            style={({ pressed }) => [m.card, pressed && { opacity: 0.8 }]}
          >
            <View style={m.row}>
              <Text style={m.money}>
                {item.amount === null ? 'غير متاح' : `${formatBalance(item.amount)} USD`}
              </Text>
              <View style={m.avatar}>
                <Icon name="bank-transfer-out" size={25} color={p.primary} />
              </View>
            </View>
            <View style={m.row}>
              <MerchantBadge {...withdrawalPresentation(item.status)} />
              <Text style={[m.caption, { writingDirection: 'ltr' }]}>#{item.id}</Text>
            </View>
            <View style={m.row}>
              <Text style={m.caption}>{merchantDisplayDate(item.requestedAt)}</Text>
              <Icon name="chevron-left" size={23} color={p.primary} />
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={{ marginTop: 18 }}>
            <MerchantNotice text="الموافقة لا تؤكد وصول الأموال. إجمالي المبلغ المسحوب يظهر في بيانات حسابك." />
          </View>
        }
        ListEmptyComponent={
          <MerchantState
            loading={query.isFetching}
            error={query.isError}
            title={query.isError ? 'تعذر تحميل سجل السحوبات' : 'لا توجد طلبات سحب بهذه الفلاتر'}
            description={
              query.isError
                ? 'يمكنك إعادة المحاولة مع الاحتفاظ بالفلاتر.'
                : 'طلبات السحب الجديدة ستظهر هنا بعد إرسالها.'
            }
            action={query.isError ? 'إعادة المحاولة' : 'عرض كل السحوبات'}
            onAction={() => {
              if (query.isError) void refetch();
              else {
                setFilters({});
                setPeriod('كل الفترات');
              }
            }}
          />
        }
      />
      <Modal
        visible={datesOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDatesOpen(false)}
      >
        <View style={m.backdrop}>
          <View style={m.sheet} accessibilityViewIsModal>
            <View style={m.handle} />
            <ScrollView
              contentContainerStyle={[m.page, { paddingBottom: Math.max(insets.bottom, 24) }]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={m.row}>
                <Text accessibilityRole="header" style={m.sectionTitle}>
                  فترة السحوبات
                </Text>
                <MerchantIconButton
                  name="close"
                  label="إغلاق الفترة"
                  onPress={() => setDatesOpen(false)}
                />
              </View>
              <Button
                title="كل الفترات"
                secondary
                onPress={() => applyPeriod('', '', 'كل الفترات')}
              />
              <View style={m.row}>
                <Button
                  title="هذا الشهر"
                  secondary
                  style={{ flex: 1 }}
                  onPress={() => {
                    const now = new Date();
                    applyPeriod(
                      dateValue(new Date(now.getFullYear(), now.getMonth(), 1)),
                      dateValue(now),
                      'هذا الشهر',
                    );
                  }}
                />
                <Button
                  title="آخر ٧ أيام"
                  secondary
                  style={{ flex: 1 }}
                  onPress={() => {
                    const now = new Date();
                    const from = new Date(now);
                    from.setDate(from.getDate() - 6);
                    applyPeriod(dateValue(from), dateValue(now), 'آخر ٧ أيام');
                  }}
                />
              </View>
              <Text style={m.sectionTitle}>فترة مخصصة</Text>
              <Text style={m.caption}>التاريخ بصيغة سنة-شهر-يوم، مثال 2026-11-18.</Text>
              {(['fromDate', 'toDate'] as const).map((key) => (
                <View key={key} style={{ gap: 6 }}>
                  <Text style={m.body}>{key === 'fromDate' ? 'من تاريخ' : 'إلى تاريخ'}</Text>
                  <View style={m.search}>
                    <Icon name="calendar-outline" size={22} color={p.primary} />
                    <TextInput
                      accessibilityLabel={key === 'fromDate' ? 'من تاريخ السحب' : 'إلى تاريخ السحب'}
                      placeholder="YYYY-MM-DD"
                      value={draft[key]}
                      onChangeText={(value) =>
                        setDraft((current) => ({ ...current, [key]: value }))
                      }
                      maxLength={10}
                      autoCorrect={false}
                      style={[m.input, { writingDirection: 'ltr' }]}
                    />
                  </View>
                </View>
              ))}
              {!!dateError && <MerchantNotice error text={dateError} />}
              <Button
                title="تطبيق الفترة"
                onPress={() => applyPeriod(draft.fromDate, draft.toDate, 'فترة مخصصة')}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
