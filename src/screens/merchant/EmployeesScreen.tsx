import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, TextInput, View } from 'react-native';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import Header from '@/components/shared/HeaderComponent';
import ScreenContainer from '@/components/shared/ScreenContainer';
import { Button } from '@/components/shared/ui';
import {
  MerchantBadge,
  MerchantChips,
  MerchantIconButton,
  MerchantNotice,
  MerchantState,
  m,
} from '@/components/merchant/workspace';
import { useMerchantEmployeesQuery } from '@/api/merchant/employees';
import { merchantAccess } from '@/domain/merchant-access';
import { employeePresentation, employeeStatusKey } from '@/domain/employee-management';
import { useSession } from '@/hooks/shared/use-session';
import { errorMessage } from '@/api/normalizers';
import { palette as p } from '@/theme/tokens';
const normalizeSearch = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '');
export default function EmployeesScreen() {
  const { userData } = useSession();
  const router = useRouter();
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const insets = useSafeAreaInsets();
  const merchantId = String(userData?.userId ?? '');
  const allowed = merchantAccess(userData, merchantId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const query = useMerchantEmployeesQuery(merchantId, {
    skip: !allowed,
    refetchOnMountOrArgChange: true,
  });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      if (allowed) void refetch();
    }, [allowed, refetch]),
  );
  const employees = query.currentData ?? [];
  const pending = employees.filter((item) => employeeStatusKey(item.status) === 'pending').length;
  const filtered = employees.filter(
    (item) =>
      (!status || employeeStatusKey(item.status) === status) &&
      normalizeSearch(`${item.name} ${item.email ?? ''}`).includes(normalizeSearch(search)),
  );
  if (!allowed) return <Redirect href="/" />;
  return (
    <ScreenContainer backgroundColor={p.background}>
      <Header
        title="إدارة الموظفين"
        rightComponent={
          <MerchantIconButton
            name="refresh"
            label="تحديث الموظفين"
            onPress={() => void refetch()}
            disabled={query.isFetching}
          />
        }
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[m.page, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !!query.currentData}
            onRefresh={() => void refetch()}
            tintColor={p.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 18 }}>
            <View style={m.hero}>
              <View style={m.row}>
                <View style={{ flex: 1 }}>
                  <Text style={m.heading}>فريقك، تحت متابعتك</Text>
                  <Text style={m.caption}>أضف موظفي متجرك وراجع حالة حساباتهم.</Text>
                </View>
                <View style={m.heroIcon}>
                  <Icon name="account-group-outline" color={p.primary} size={29} />
                </View>
              </View>
              <View style={m.row}>
                <Text style={m.body}>
                  {query.isFetching || query.isError ? '—' : employees.length} موظفين
                </Text>
                <MerchantBadge
                  label={
                    query.isFetching || query.isError
                      ? 'جارٍ التحقق من الحالات'
                      : `${pending} بانتظار الموافقة`
                  }
                  tone="pending"
                />
              </View>
            </View>
            {notice === 'deleted' && <MerchantNotice text="تم حذف الموظف وتحديث قائمة فريقك." />}
            <Button
              title="إضافة موظف"
              icon="account-plus-outline"
              onPress={() => router.push('/merchant/create-employee')}
            />
            <View style={m.search}>
              <Icon name="magnify" size={24} color={p.muted} />
              <TextInput
                accessibilityLabel="البحث في الموظفين"
                placeholder="ابحث بالاسم أو البريد"
                placeholderTextColor={p.muted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                style={m.input}
              />
              {!!search && (
                <MerchantIconButton
                  name="close"
                  label="مسح بحث الموظفين"
                  onPress={() => setSearch('')}
                />
              )}
            </View>
            <MerchantChips
              items={[
                { value: '', label: 'الكل' },
                { value: 'pending', label: 'بانتظار الموافقة' },
                { value: 'approved', label: 'مقبول' },
                { value: 'rejected', label: 'مرفوض' },
              ]}
              label="حالة الموظف"
              selected={status}
              onSelect={setStatus}
            />
            <View style={m.row}>
              <Text style={m.sectionTitle}>موظفو متجرك</Text>
              <Text style={m.caption}>
                {query.isFetching ? 'جارٍ التحديث…' : `${filtered.length} نتائج`}
              </Text>
            </View>
            {query.isError && <MerchantNotice error text={errorMessage(query.error)} />}
            {query.isError && !!employees.length && (
              <Button title="إعادة تحميل الموظفين" secondary onPress={() => void refetch()} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`عرض الموظف ${item.name}`}
            onPress={() => router.push({ pathname: '/merchant/employee', params: { id: item.id } })}
            style={({ pressed }) => [m.card, pressed && { opacity: 0.8 }]}
          >
            <View style={m.row}>
              <View style={m.avatar}>
                <Text style={m.initial}>{item.name[0]}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={m.sectionTitle}>{item.name}</Text>
                <Text numberOfLines={1} style={[m.caption, { writingDirection: 'ltr' }]}>
                  {item.email ?? 'البريد غير متاح'}
                </Text>
              </View>
              <Icon name="chevron-left" size={24} color={p.muted} />
            </View>
            <MerchantBadge {...employeePresentation(item.status)} />
          </Pressable>
        )}
        ListEmptyComponent={
          <MerchantState
            loading={query.isFetching}
            error={query.isError}
            title={
              query.isError
                ? 'تعذر تحميل الموظفين'
                : employees.length
                  ? 'لا يوجد موظفون مطابقون'
                  : 'ابدأ ببناء فريقك'
            }
            description={
              query.isError
                ? 'حاول تحديث القائمة مرة أخرى.'
                : employees.length
                  ? 'جرّب اسمًا آخر أو اعرض جميع الحالات.'
                  : 'أضف أول موظف لمساعدتك في متابعة أعمال متجرك.'
            }
            action={
              query.isError
                ? 'إعادة المحاولة'
                : employees.length
                  ? 'عرض جميع الموظفين'
                  : 'إضافة أول موظف'
            }
            onAction={() => {
              if (query.isError) void refetch();
              else if (employees.length) {
                setStatus('');
                setSearch('');
              } else router.push('/merchant/create-employee');
            }}
          />
        }
      />
    </ScreenContainer>
  );
}
