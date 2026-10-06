import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSalesCatalog } from '@/hooks/sales-employee';
import { useScreenProps } from '@/navigation/use-screen-props';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Text from '@/components/shared/CustomText';
import { Brand, Button } from '@/components/shared/ui';
import { SalesProductCard } from '@/components/sales-employee/SalesProductCard';
import { catalogPalette as p } from '@/components/shared/catalog/catalog-theme';
import { normalizeNumber } from '@/components/shared/catalog/catalog-model';
import { typography } from '@/theme/tokens';
import { catalogErrorMessage } from '@/domain/catalog-error';

export default function SalesProductsScreen() {
  const catalog = useSalesCatalog();
  const { navigation } = useScreenProps();
  const [search, setSearch] = useState('');
  const products = useMemo(() => {
    const key = normalizeNumber(search).trim().toLocaleLowerCase();
    return catalog.data.filter((product) =>
      normalizeNumber(`${product.name} ${product.productCode}`).toLocaleLowerCase().includes(key),
    );
  }, [catalog.data, search]);
  return (
    <ScreenContainer backgroundColor={p.background}>
      <View style={s.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.eyebrow}>مساحة المبيعات</Text>
          <Text accessibilityRole="header" style={s.title}>
            منتجات لطلبك القادم
          </Text>
        </View>
        <Brand compact />
      </View>
      <View style={s.tools}>
        <Text style={s.caption}>اختر المنتج، حدّد السعر، وأنشئ طلبك.</Text>
        <View style={s.search}>
          <Icon name="magnify" size={23} color={p.muted} />
          <TextInput
            accessibilityLabel="البحث في منتجات المبيعات"
            placeholder="ابحث باسم المنتج أو الكود"
            placeholderTextColor={p.muted}
            value={search}
            onChangeText={setSearch}
            style={s.input}
          />
          {!!search && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="مسح البحث"
              onPress={() => setSearch('')}
              style={s.clear}
            >
              <Icon name="close" size={20} color={p.muted} />
            </Pressable>
          )}
        </View>
        <View style={s.countRow}>
          <Text style={s.count}>
            {catalog.loading
              ? 'جارٍ تحميل المنتجات'
              : `${products.length} منتج${search ? ` من ${catalog.totalCount}` : ''}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تحديث المنتجات"
            disabled={catalog.fetching}
            onPress={() => void catalog.refresh()}
            style={s.refresh}
          >
            <Icon name="refresh" size={20} color={p.primary} />
            <Text style={s.refreshText}>تحديث</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={products}
        keyExtractor={(product) => String(product.productCode)}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={catalog.fetching && !catalog.loading}
            onRefresh={() => void catalog.refresh()}
            tintColor={p.primary}
          />
        }
        renderItem={({ item }) => (
          <SalesProductCard
            product={item}
            onCreate={() => navigation.navigate('CreateOrder', { product: item })}
          />
        )}
        ListHeaderComponent={
          catalog.error ? (
            <View style={s.state}>
              <Text accessibilityRole="alert" style={s.error}>
                {catalogErrorMessage(catalog.error)}
              </Text>
              {!!catalog.data.length && (
                <Text style={s.caption}>المعروض آخر بيانات تم تحميلها.</Text>
              )}
              <Button
                title="إعادة المحاولة"
                secondary
                onPress={() => void catalog.retry()}
                disabled={catalog.fetching}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !catalog.error ? (
            <View style={s.state}>
              {catalog.loading ? (
                <ActivityIndicator color={p.primary} />
              ) : (
                <>
                  <Icon
                    name={search ? 'magnify' : 'package-variant-closed'}
                    color={p.primary}
                    size={40}
                  />
                  <Text style={s.emptyTitle}>
                    {search ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات حاليًا'}
                  </Text>
                  <Text style={s.caption}>
                    {search
                      ? 'جرّب اسمًا آخر أو كود المنتج.'
                      : 'ستظهر هنا المنتجات التي يمكنك إضافتها إلى الطلب.'}
                  </Text>
                </>
              )}
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  eyebrow: { color: p.champagne, fontSize: 12, textAlign: 'right', lineHeight: 22 },
  title: { color: p.deep, fontSize: 23, fontWeight: '700', textAlign: 'right', lineHeight: 35 },
  tools: { paddingHorizontal: 20, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' },
  caption: { color: p.muted, fontSize: 13, lineHeight: 24, textAlign: 'right' },
  search: {
    minHeight: 52,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderColor: p.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  input: {
    fontFamily: typography.regular,
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    fontSize: 13,
    color: p.ink,
    textAlign: 'right',
  },
  clear: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  countRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  count: { color: p.deep, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  refresh: { minHeight: 44, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  refreshText: { color: p.primary, fontSize: 12 },
  list: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  state: { backgroundColor: '#FFF', borderRadius: 18, padding: 22, gap: 14, alignItems: 'stretch' },
  error: { color: p.danger, fontSize: 13, lineHeight: 24, textAlign: 'right' },
  emptyTitle: { color: p.deep, fontSize: 18, fontWeight: '700', textAlign: 'right' },
});
