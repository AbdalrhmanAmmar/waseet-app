import { externalTerminal } from '@/domain/external-order-policy';
import { internalTerminal } from '@/domain/internal-order-policy';
import { OrderDeliveryFilters } from './OrderDeliveryFilters';
import { useOrderDeliveryFilters } from '@/hooks/shared/use-order-delivery-filters';
import { resolveDeliveryMode } from '@/domain/order-delivery-list';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Images from '@/theme/images';
import type { useOrderWorkspace } from '@/hooks/shared/use-order-workspace';
import type { ComponentType } from 'react';
import type { OrderStatusSheetProps } from './OrderStatusSheet';
import { useSession } from '@/hooks/shared/use-session';
import { useScreenProps } from '@/navigation/use-screen-props';
import { useOrderStatusesQuery } from '@/api/shared/orders';
import { filterOrders, isOrderTerminal } from '@/domain/order-workspace';
import { statusLabel } from '@/components/shared/orders/statuses';
import { WorkspaceOrderCard } from './WorkspaceOrderCard';
import { colors as p, styles as s } from './workspace-styles';
import type { Id } from '@/types/models';
export function OrdersWorkspace({
  controller,
  variant,
  StatusSheet,
}: {
  controller: ReturnType<typeof useOrderWorkspace>;
  variant: 'delivery' | 'management';
  StatusSheet: ComponentType<OrderStatusSheetProps>;
}) {
  const management = variant === 'management';
  const pageTitle = management ? 'طلبات الإدارة' : 'طلبات التوصيل';
  const { userData } = useSession();
  const { navigation } = useScreenProps();
  const statuses = useOrderStatusesQuery();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const delivery = useOrderDeliveryFilters(controller.orders);
  const [selected, setSelected] = useState<Id | null>(null);
  const [saved, setSaved] = useState(false);
  const attention = controller.orders.filter(
    (order) =>
      !(resolveDeliveryMode(order, delivery.areas) === 'internal'
        ? internalTerminal(order.status)
        : resolveDeliveryMode(order, delivery.areas) === 'external'
          ? externalTerminal(order.status)
          : isOrderTerminal(order.status, statuses.data)),
  ).length;
  const filtered = useMemo(
    () =>
      filterOrders(
        delivery.orders.filter(
          (order) =>
            filter !== 'attention' ||
            !(resolveDeliveryMode(order, delivery.areas) === 'internal'
              ? internalTerminal(order.status)
              : resolveDeliveryMode(order, delivery.areas) === 'external'
                ? externalTerminal(order.status)
                : isOrderTerminal(order.status, statuses.data)),
        ),
        search,
        filter === 'attention' ? '' : filter,
        statuses.data,
      ),
    [delivery.orders, delivery.areas, search, filter, statuses.data],
  );
  const filters = [
    { value: 'attention', label: `تحتاج متابعة ${attention}` },
    { value: '', label: `الكل ${controller.orders.length}` },
  ];
  const title =
    filter === 'attention' ? 'طلبات تحتاج متابعة' : !filter ? 'كل الطلبات' : statusLabel(filter);
  return (
    <ScreenContainer backgroundColor={p.background} edges={['top', 'left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={(order) => String(order.orderId)}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={controller.fetching && !controller.hasMore && !!controller.orders.length}
            onRefresh={() => void controller.refresh()}
            tintColor={p.primary}
            colors={[p.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <View style={s.heading}>
                <Text style={s.greeting}>أهلًا، {userData?.firstName || 'بك'}</Text>
                <Text accessibilityRole="header" style={s.title}>
                  {pageTitle}
                </Text>
              </View>
              <View style={s.brand} accessible accessibilityLabel="وسيط">
                <Image source={Images.brandLogo} style={s.logo} />
                <Text style={s.brandName}>وسيط</Text>
              </View>
            </View>
            <Text style={s.subtitle}>
              {management
                ? 'تابع الطلبات وتواصل مع العملاء وحدّث الحالة'
                : 'تابع مهامك وحدّث حالة الطلب بسهولة'}
            </Text>
            <View style={s.summary}>
              {[
                {
                  label: management ? 'إجمالي الطلبات' : 'طلبات مسندة إليك',
                  value: controller.orders.length,
                  icon: 'package-variant-closed' as const,
                },
                { label: 'تحتاج متابعة', value: attention, icon: 'clock-outline' as const },
              ].map((item) => (
                <View key={item.label} style={s.metric}>
                  <Text style={s.metricLabel}>{item.label}</Text>
                  <View style={s.metricRow}>
                    <Text style={s.number}>
                      {controller.loading || (controller.error && !controller.orders.length)
                        ? '—'
                        : item.value.toLocaleString('ar-EG')}
                    </Text>
                    <Icon name={item.icon} size={27} color={p.primary} />
                  </View>
                </View>
              ))}
            </View>
            {!controller.complete && (
              <Text style={s.hint}>الأعداد والبحث ضمن الطلبات المحمّلة حتى الآن.</Text>
            )}
            <View style={s.search}>
              <Icon name="magnify" size={23} color={p.muted} />
              <TextInput
                accessibilityLabel={`البحث في ${pageTitle}`}
                placeholder="ابحث برقم الطلب أو العميل أو الهاتف"
                placeholderTextColor={p.muted}
                value={search}
                onChangeText={setSearch}
                style={s.input}
                autoCorrect={false}
                returnKeyType="search"
              />
              {!!search && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="مسح البحث"
                  onPress={() => setSearch('')}
                  style={s.iconButton}
                >
                  <Icon name="close" size={18} color={p.muted} />
                </Pressable>
              )}
            </View>
            <OrderDeliveryFilters controller={delivery} />
            <FlatList
              horizontal
              inverted
              data={filters}
              keyExtractor={(item) => item.value}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filters}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`فلتر ${item.value === 'attention' ? 'تحتاج متابعة' : !item.value ? 'الكل' : item.label}`}
                  aria-selected={filter === item.value}
                  onPress={() => setFilter(item.value)}
                  style={[s.pill, filter === item.value && s.active]}
                >
                  <Text style={[s.pillText, filter === item.value && s.white]}>{item.label}</Text>
                </Pressable>
              )}
            />
            <View style={s.section}>
              <Text style={s.sectionTitle}>{title}</Text>
              <Text accessibilityLiveRegion="polite" style={s.hint}>
                {filtered.length} طلبات
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`تحديث ${pageTitle}`}
                disabled={controller.fetching}
                onPress={() => void controller.refresh()}
                style={s.iconButton}
              >
                <Icon name="refresh" size={22} color={p.primary} />
              </Pressable>
            </View>
            {saved && (
              <View style={s.notice}>
                <Text accessibilityLiveRegion="polite" style={s.buttonText}>
                  تم تحديث حالة الطلب.
                </Text>
              </View>
            )}
            {!!controller.error && (
              <View style={s.notice}>
                <Text accessibilityRole="alert" style={s.error}>
                  {controller.orders.length
                    ? 'تعذر تحميل كل الطلبات. المعروض هو ما تم تحميله؛ الأعداد والبحث قد لا يشملان كل الطلبات.'
                    : `تعذر تحميل ${pageTitle}.`}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={controller.fetching}
                  onPress={controller.retry}
                  style={s.secondary}
                >
                  <Text style={s.buttonText}>إعادة المحاولة</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <WorkspaceOrderCard
            variant={variant}
            order={item}
            mode={resolveDeliveryMode(item, delivery.areas)}
            terminal={
              resolveDeliveryMode(item, delivery.areas) === 'internal'
                ? internalTerminal(item.status)
                : resolveDeliveryMode(item, delivery.areas) === 'external'
                  ? externalTerminal(item.status)
                  : isOrderTerminal(item.status, statuses.data)
            }
            onOpen={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
            onUpdate={() => {
              setSaved(false);
              setSelected(item.orderId);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={s.state}>
            {controller.loading || (controller.hasMore && !controller.error) ? (
              <>
                <ActivityIndicator color={p.primary} />
                <Text style={s.hint}>جارٍ تحميل طلباتك…</Text>
              </>
            ) : !controller.error ? (
              <>
                <Icon name="clipboard-check-outline" size={44} color={p.primary} />
                <Text style={[s.sectionTitle, s.center]}>
                  {search
                    ? 'لا توجد نتائج مطابقة'
                    : controller.orders.length
                      ? 'لا توجد طلبات بهذه الحالة'
                      : management
                        ? 'لا توجد طلبات متاحة حاليًا'
                        : 'لا توجد طلبات مسندة إليك حاليًا'}
                </Text>
                {!!(search || filter) && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setSearch('');
                      setFilter('');
                      delivery.clear();
                    }}
                    style={s.pill}
                  >
                    <Text style={s.buttonText}>عرض كل الطلبات</Text>
                  </Pressable>
                )}
              </>
            ) : null}
          </View>
        }
        ListFooterComponent={
          controller.hasMore && !controller.error && filtered.length ? (
            <View style={s.state}>
              <ActivityIndicator color={p.primary} />
              <Text style={s.hint}>جارٍ تحميل بقية الطلبات…</Text>
            </View>
          ) : null
        }
      />
      {selected != null && (
        <StatusSheet
          key={String(selected)}
          orderId={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            setSaved(true);
          }}
        />
      )}
    </ScreenContainer>
  );
}
