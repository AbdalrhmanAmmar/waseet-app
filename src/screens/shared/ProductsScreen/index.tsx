import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import ScreenContainer from '@/components/shared/ScreenContainer';
import { CatalogProductCard } from '@/components/shared/catalog/CatalogProductCard';
import { CatalogFilters } from '@/components/shared/catalog/CatalogFilters';
import {
  defaultFilters,
  filterProducts,
  sortOptions,
  type Filters,
} from '@/components/shared/catalog/catalog-model';
import type { CatalogController } from '@/hooks/shared/use-catalog';
import { useCatalogView } from '@/hooks/shared/use-catalog-view';
import { useSession } from '@/hooks/shared/use-session';
import type { ScreenProps } from '@/navigation/use-screen-props';
import type { Product } from '@/types/models';
import { catalogErrorMessage } from '@/domain/catalog-error';
import Images from '@/theme/images';
import { catalogPalette as p } from '@/components/shared/catalog/catalog-theme';
import { styles as s } from './styles';

type Row =
  | { key: string; type: 'hero' | 'search' | 'toolbar' | 'state' }
  | { key: string; type: 'products'; items: Product[] };
export default function ProductsScreen({
  navigation,
  catalog,
}: {
  navigation: ScreenProps['navigation'];
  catalog: CatalogController;
}) {
  const { role } = useSession();
  const { width, fontScale } = useWindowDimensions();
  const [view, setView] = useCatalogView();
  const listView = view === 'list' || width < 350 || fontScale > 1.25;
  const columns = listView ? 1 : width >= 740 ? 3 : 2;
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  // The API documents pagination only. Load remaining pages sequentially while this screen is active.
  // On failure, retain loaded products and wait for explicit retry rather than looping requests.
  useEffect(() => {
    if (focused && catalog.hasMore && !catalog.fetching && !catalog.error) catalog.loadMore();
  }, [focused, catalog]);
  const complete = !catalog.loading && !catalog.hasMore && !catalog.error;
  const categories = [
    ...new Set(
      catalog.data
        .filter((item) => item.categoryProvided !== false)
        .map((item) => item.category)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'ar'));
  const products = useMemo(
    () => filterProducts(catalog.data, search, filters),
    [catalog.data, search, filters],
  );
  const activeCount =
    Number(!!filters.category) +
    Number(filters.available) +
    Number(!!(filters.min || filters.max)) +
    Number(filters.sort !== 'default');
  const reset = () => {
    setSearch('');
    setFilters({ ...defaultFilters });
  };
  const refresh = async () => {
    setRefreshing(true);
    try {
      await catalog.refresh();
    } finally {
      setRefreshing(false);
    }
  };
  const retry = () => {
    void catalog.retry();
  };
  const rows: Row[] = [
    { key: 'hero', type: 'hero' },
    { key: 'search', type: 'search' },
    { key: 'toolbar', type: 'toolbar' },
  ];
  if (!products.length) rows.push({ key: 'state', type: 'state' });
  for (let i = 0; i < products.length; i += columns)
    rows.push({
      key: String(products[i].productCode),
      type: 'products',
      items: products.slice(i, i + columns),
    });
  const chips = [
    ...(filters.category
      ? [{ label: filters.category, clear: () => setFilters({ ...filters, category: '' }) }]
      : []),
    ...(filters.available
      ? [{ label: 'المتوفر فقط', clear: () => setFilters({ ...filters, available: false }) }]
      : []),
    ...(filters.min || filters.max
      ? [
          {
            label: `السعر: ${filters.min || '0'} – ${filters.max || '∞'} USD`,
            clear: () => setFilters({ ...filters, min: '', max: '' }),
          },
        ]
      : []),
    ...(filters.sort !== 'default'
      ? [
          {
            label: sortOptions.find((o) => o.id === filters.sort)!.label,
            clear: () => setFilters({ ...filters, sort: 'default' }),
          },
        ]
      : []),
  ];
  const render = ({ item }: { item: Row }) => {
    if (item.type === 'hero')
      return (
        <View style={s.hero}>
          <View style={s.heading}>
            <Text accessibilityRole="header" style={s.title}>
              المنتجات
            </Text>
            <Text style={s.subtitle}>
              {catalog.loading
                ? 'جارٍ تحميل الكتالوج…'
                : complete
                  ? `${catalog.data.length} منتجًا`
                  : `${catalog.data.length} منتج محمّل`}
            </Text>
          </View>
          <View style={s.headerControls}>
            <View style={s.brand} accessibilityLabel="وسيط" accessible>
              <Image source={Images.brandLogo} style={s.logo} />
              <Text style={s.brandName}>وسيط</Text>
            </View>
            <View style={s.toggle}>
              {(['grid', 'list'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityLabel={mode === 'grid' ? 'عرض شبكي' : 'عرض قائمة'}
                  aria-checked={view === mode}
                  onPress={() => setView(mode)}
                  style={({ pressed }) => [
                    s.toggleButton,
                    view === mode && s.activeToggle,
                    pressed && s.pressed,
                  ]}
                >
                  <Icon
                    name={mode === 'grid' ? 'view-grid-outline' : 'format-list-bulleted'}
                    size={22}
                    color={view === mode ? p.primary : p.muted}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      );
    if (item.type === 'search')
      return (
        <View style={s.sticky}>
          <View style={s.searchRow}>
            <View style={s.searchBox}>
              <Icon name="magnify" size={22} color={p.muted} />
              <TextInput
                accessibilityLabel="البحث عن المنتجات"
                placeholder="ابحث باسم المنتج أو الكود"
                placeholderTextColor={p.muted}
                value={search}
                onChangeText={setSearch}
                style={s.search}
                returnKeyType="search"
                autoCorrect={false}
              />
              {!!search && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="مسح البحث"
                  onPress={() => setSearch('')}
                  style={s.clear}
                >
                  <Icon name="close" size={18} color={p.muted} />
                </Pressable>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`تصفية وترتيب، ${activeCount} فلاتر مفعلة`}
              onPress={() => setFiltersOpen(true)}
              style={({ pressed }) => [s.filterButton, pressed && s.pressed]}
            >
              <Icon name="tune-variant" size={25} color={p.deep} />
              {!!activeCount && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{activeCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.categories}
            keyboardShouldPersistTaps="handled"
          >
            {['', ...categories].map((category) => (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityLabel={`تصنيف ${category || 'الكل'}`}
                aria-selected={filters.category === category}
                onPress={() => setFilters({ ...filters, category })}
                style={[s.pill, filters.category === category && s.pillActive]}
              >
                <Text style={[s.pillText, filters.category === category && s.white]}>
                  {category || 'الكل'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {!!chips.length && (
            <View style={s.chips}>
              {chips.map((chip) => (
                <Pressable
                  key={chip.label}
                  accessibilityRole="button"
                  accessibilityLabel={`إزالة فلتر ${chip.label}`}
                  onPress={chip.clear}
                  style={s.chip}
                >
                  <Text style={s.chipText}>{chip.label}</Text>
                  <Icon name="close" size={15} color={p.primary} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      );
    if (item.type === 'toolbar')
      return (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={s.toolbar}>
            <View style={s.results}>
              <Text accessibilityLiveRegion="polite" style={s.count}>
                {catalog.loading
                  ? 'جارٍ التحميل…'
                  : complete
                    ? `${products.length} نتيجة`
                    : `${products.length} نتيجة ضمن ${catalog.data.length} منتج محمّل`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ترتيب المنتجات"
              onPress={() => setFiltersOpen(true)}
              style={({ pressed }) => [s.sortButton, pressed && s.pressed]}
            >
              <Text style={s.sortText}>
                الترتيب: {sortOptions.find((option) => option.id === filters.sort)!.label}
              </Text>
              <Icon name="chevron-down" size={19} color={p.deep} />
            </Pressable>
          </View>
          {!!catalog.error && catalog.data.length > 0 && (
            <View style={s.state}>
              <Text accessibilityRole="alert" style={s.stateText}>
                {catalog.nextPageError
                  ? 'تعذر تحميل بقية المنتجات. المنتجات المحمّلة ما زالت معروضة.'
                  : 'تعذر تحديث المنتجات. المعروض هو آخر بيانات تم تحميلها.'}
                {'\n'}
                {catalogErrorMessage(catalog.error)}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                disabled={catalog.fetching}
                style={s.retry}
              >
                <Text style={s.retryText}>
                  {catalog.fetching ? 'جارٍ إعادة المحاولة…' : 'إعادة المحاولة'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      );
    if (item.type === 'state') {
      if (catalog.loading)
        return (
          <View accessibilityLabel="جارٍ تحميل المنتجات" style={s.rows}>
            {[0, 1].map((row) => (
              <View key={row} style={s.row}>
                {Array.from({ length: columns }, (_, i) => (
                  <View key={i} style={s.skeleton}>
                    <View style={s.skeletonImage} />
                    <View style={s.skeletonLine} />
                    <View style={[s.skeletonLine, { width: '55%' }]} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      if (catalog.error && !catalog.data.length)
        return (
          <View style={s.state}>
            <Icon name="cloud-off-outline" size={44} color={p.muted} />
            <Text accessibilityRole="alert" style={s.stateTitle}>
              تعذر تحميل المنتجات
            </Text>
            <Text style={s.stateText}>{catalogErrorMessage(catalog.error)}</Text>
            <Pressable accessibilityRole="button" onPress={retry} style={s.retry}>
              <Text style={s.retryText}>إعادة المحاولة</Text>
            </Pressable>
          </View>
        );
      if (!complete && !catalog.error)
        return (
          <View style={s.state}>
            <ActivityIndicator color={p.primary} />
            <Text style={s.stateText}>نبحث في بقية المنتجات…</Text>
          </View>
        );
      return (
        <View style={s.state}>
          <Icon
            name={search || activeCount ? 'magnify' : 'package-variant-closed'}
            size={46}
            color={p.muted}
          />
          <Text accessibilityRole="header" style={s.stateTitle}>
            {!complete
              ? 'لا توجد نتائج ضمن المنتجات المحمّلة'
              : search || activeCount
                ? 'لا توجد نتائج مطابقة'
                : 'لا توجد منتجات حاليًا'}
          </Text>
          <Text style={s.stateText}>
            {!complete
              ? 'أعد محاولة التحميل لإكمال البحث في بقية الكتالوج.'
              : search || activeCount
                ? 'جرّب اسمًا أو كودًا آخر، أو غيّر الفلاتر.'
                : 'ستظهر المنتجات هنا عند إضافتها إلى الكتالوج.'}
          </Text>
          {!!(search || activeCount) && (
            <Pressable accessibilityRole="button" onPress={reset} style={s.retry}>
              <Text style={s.retryText}>مسح البحث والفلاتر</Text>
            </Pressable>
          )}
        </View>
      );
    }
    if (item.type !== 'products') return null;
    return (
      <View style={s.rows}>
        <View style={s.row}>
          {item.items.map((product) => (
            <CatalogProductCard
              key={String(product.productCode)}
              item={product}
              list={listView}
              merchant={role === 'Merchant'}
              onPress={() => navigation.navigate('ProductDetails', { product })}
              onCreateOrder={() => navigation.navigate('CreateOrder', { product })}
            />
          ))}
          {Array.from({ length: columns - item.items.length }, (_, i) => (
            <View key={`blank-${i}`} style={s.spacer} />
          ))}
        </View>
      </View>
    );
  };
  return (
    <ScreenContainer backgroundColor={p.background} edges={['top', 'left', 'right']}>
      <FlatList
        style={s.list}
        contentContainerStyle={s.content}
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={render}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={p.primary}
            colors={[p.primary]}
          />
        }
        ListFooterComponent={
          catalog.hasMore && !catalog.error ? (
            <View style={s.progress}>
              <ActivityIndicator size="small" color={p.primary} />
              <Text style={s.progressText}>
                تحميل بقية الكتالوج · {catalog.data.length}
                {catalog.totalCount ? ` من ${catalog.totalCount}` : ''}
              </Text>
            </View>
          ) : null
        }
      />
      {filtersOpen && (
        <CatalogFilters
          initial={filters}
          categories={categories}
          complete={complete}
          onClose={() => setFiltersOpen(false)}
          onApply={(value) => {
            setFilters(value);
            setFiltersOpen(false);
          }}
        />
      )}
    </ScreenContainer>
  );
}
