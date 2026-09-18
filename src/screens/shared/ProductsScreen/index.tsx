import { AsyncState } from '@/components/shared/AsyncState';
import ProductCard from '@/components/shared/ProductCard/index';
import {
  CustomText,
  CustomTextInput,
  HeaderComponent,
  ScreenContainer,
} from '@/components/shared/index';
import type { CatalogController } from '@/hooks/shared/use-catalog';
import { ScreenNames } from '@/navigation/ScreenNames';
import { styles } from '@/screens/shared/ProductsScreen/styles';
import { addToCartLocal } from '@/store/slices/cart';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';

const SORT_OPTIONS = [
  { id: 'default', label: 'الافتراضي' },
  { id: 'price_asc', label: 'الأقل سعراً' },
  { id: 'price_desc', label: 'الأعلى سعراً' },
  { id: 'title_az', label: 'الاسم: أ ← ي' },
];

export default function ProductsScreen({
  navigation,
  catalog,
}: {
  navigation: any;
  catalog: CatalogController;
}) {
  const dispatch = useDispatch<any>();
  const allProducts = catalog;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [search, setSearch] = useState('');
  const [sortId, setSortId] = useState('default');
  const [sortOpen, setSortOpen] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await catalog.refresh();
    setRefreshing(false);
  };
  const handleEndReached = catalog.loadMore;
  const rawProducts = catalog.data;
  const categories = ['All', ...new Set(rawProducts.map((item) => item.category))];

  const handleAddToCart = (item: any) => {
    if (item.stock === 0 || item.quantity === 0) {
      Toast.show({
        type: 'error',
        text1: 'تنبيه',
        text2: 'هذا المنتج غير متوفر في المخزون حالياً',
      });
      return;
    }
    dispatch(addToCartLocal(item));
    Toast.show({ type: 'success', text1: 'تمت الإضافة للسلة' });
  };

  const filtered = useMemo(() => {
    let list = [...rawProducts];

    if (selectedCategoryId !== 'All') {
      list = list.filter((b: any) => b.category === selectedCategoryId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b: any) =>
          b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q)),
      );
    }

    switch (sortId) {
      case 'price_asc':
        return [...list].sort((a: any, b: any) => a.price - b.price);
      case 'price_desc':
        return [...list].sort((a: any, b: any) => b.price - a.price);
      case 'title_az':
        return [...list].sort((a: any, b: any) => a.title.localeCompare(b.title));
      default:
        return list;
    }
  }, [selectedCategoryId, search, sortId, rawProducts]);

  const totalCount = allProducts?.totalCount || filtered.length;

  const ListHeader = (
    <View style={styles.listHeader}>
      <AsyncState loading={catalog.loading} error={catalog.error} onRetry={onRefresh} />
      {/* Title + Sort */}
      <View style={styles.titleRow}>
        <CustomText style={styles.screenTitle}>المنتجات</CustomText>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <CustomTextInput
          placeholder="ابحث عن منتج..."
          value={search}
          onChangeText={setSearch}
          rightComponent={<Icon name="magnify" size={hp(2.1)} color="#AAA" />}
          containerStyle={{ flex: 1, marginBottom: 0 }}
        />
        <TouchableOpacity style={styles.filterIconBtn} onPress={() => setSortOpen(true)}>
          <Icon name="tune" size={hp(2.1)} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.pill, selectedCategoryId === cat && styles.pillActive]}
            onPress={() => setSelectedCategoryId(cat)}
          >
            <CustomText
              style={[styles.pillText, selectedCategoryId === cat && styles.pillTextActive]}
            >
              {cat === 'All' ? 'الكل' : cat}
            </CustomText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: hp(1.4),
        }}
      >
        <CustomText style={styles.resultsCount}>تم العثور على {filtered.length} منتج</CustomText>
        {totalCount > 0 && (
          <CustomText style={styles.resultsCount}>الإجمالي: {totalCount}</CustomText>
        )}
      </View>
    </View>
  );

  const ListFooter = () => {
    if (allProducts?.loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.mainOrange} />
          <CustomText style={{ fontSize: hp(1.4), color: COLORS.gray, marginTop: 4 }}>
            جاري تحميل المزيد...
          </CustomText>
        </View>
      );
    }
    return null;
  };

  return (
    <ScreenContainer>
      <HeaderComponent title="المنتجات" />
      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.productCode || i.id)}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.flatContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.mainOrange]}
          />
        }
        renderItem={({ item, index }) => (
          <ProductCard
            item={item}
            index={index}
            onPress={() => navigation.navigate(ScreenNames.ProductDetails, { product: item })}
            onAddToCart={() => handleAddToCart(item)}
          />
        )}
        ListEmptyComponent={
          allProducts?.loading ? (
            <View style={{ paddingVertical: hp(10), alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.mainOrange} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Icon name="package-variant" size={hp(7.1)} color="#DDD" />
              <CustomText style={styles.emptyTitle}>لا توجد منتجات مطابقة</CustomText>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSearch('');
                  setSelectedCategoryId('All');
                  setSortId('default');
                }}
              >
                <CustomText style={styles.resetBtnText}>إعادة ضبط الفلاتر</CustomText>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Sort Modal */}
      <Modal
        visible={sortOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSortOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortOpen(false)}
        >
          <View style={styles.sortSheet}>
            <View style={styles.sheetHandle} />
            <CustomText style={styles.sheetTitle}>ترتيب المنتجات</CustomText>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sortOption, sortId === opt.id && styles.sortOptionActive]}
                onPress={() => {
                  setSortId(opt.id);
                  setSortOpen(false);
                }}
              >
                <CustomText
                  style={[styles.sortOptionText, sortId === opt.id && styles.sortOptionTextActive]}
                >
                  {opt.label}
                </CustomText>
                {sortId === opt.id && (
                  <Icon name="check" size={hp(2.1)} color={COLORS.mainOrange} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}
