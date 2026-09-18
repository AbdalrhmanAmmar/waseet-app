import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ScreenContainer from '@/components/shared/ScreenContainer';
import Text from '@/components/shared/CustomText';
import { Button } from '@/components/shared/ui';
import { ProductMedia } from '@/components/shared/product-details/ProductMedia';
import { useProductDetails } from '@/hooks/shared/use-product-details';
import { formatMoney, updatedDate } from '@/domain/product-details';
import type { ScreenProps } from '@/navigation/use-screen-props';
import type { Product } from '@/types/models';
import { palette as p } from '@/theme/tokens';
import { styles as s } from './styles';

export default function ProductDetails(props: ScreenProps) {
  const initial = props.route.params.product as Product | undefined;
  const id = String(props.route.params.id ?? initial?.productCode ?? '');
  return <Details key={id} {...props} id={id} initial={initial} />;
}
function Details({ navigation, id, initial }: ScreenProps & { id: string; initial?: Product }) {
  const detail = useProductDetails(id, initial);
  const { product, merchant, stock, cart } = detail;
  const [copied, setCopied] = useState('');
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 350 || fontScale > 1.25;
  const date = updatedDate(product?.updatedAt);
  const copy = async () => {
    try {
      const success = await Clipboard.setStringAsync(id);
      setCopied(success ? 'تم نسخ كود المنتج' : 'تعذر النسخ. يمكنك تحديد الكود ونسخه.');
    } catch {
      setCopied('تعذر النسخ. يمكنك تحديد الكود ونسخه.');
    }
  };
  const openCart = () => navigation.navigate('CartScreen');
  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('ProductsScreen');
  };
  const missing = !id || detail.notFound;
  const description = product?.description?.trim();
  const longDescription =
    !!description && (description.length > 180 || description.split('\n').length > 4);
  const footerTitle = detail.viewCart
    ? 'عرض السلة'
    : detail.busy
      ? 'جارٍ تحديث البيانات…'
      : stock === 0
        ? 'غير متوفر حاليًا'
        : cart
          ? detail.quantity === 0
            ? 'حذف من السلة'
            : 'تحديث السلة'
          : 'إضافة إلى السلة';
  return (
    <ScreenContainer edges={['top', 'bottom']} backgroundColor={p.background}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          accessibilityHint="العودة إلى الصفحة السابقة أو قائمة المنتجات"
          onPress={goBack}
          hitSlop={8}
          style={({ pressed }) => [s.iconButton, s.backButton, pressed && { opacity: 0.65 }]}
        >
          <Icon name="arrow-right" size={26} color={p.deep} />
        </Pressable>
        <Text accessibilityRole="header" style={s.headerTitle}>
          تفاصيل المنتج
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`فتح السلة، ${detail.cartCount} قطعة`}
          onPress={openCart}
          style={s.iconButton}
        >
          <Icon name="cart-outline" size={25} color={p.primary} />
          {detail.cartCount > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{detail.cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      {missing ? (
        <View style={s.state}>
          <Icon name="package-variant-closed" size={52} color={p.muted} />
          <Text accessibilityRole="header" style={s.stateTitle}>
            {id ? 'المنتج غير موجود' : 'رابط المنتج غير صحيح'}
          </Text>
          <Text style={s.stateText}>ارجع إلى الكتالوج لاختيار منتج متاح.</Text>
          <Button title="العودة للمنتجات" onPress={() => navigation.replace('ProductsScreen')} />
        </View>
      ) : !product && detail.loading ? (
        <ScrollView contentContainerStyle={s.page} accessibilityLabel="جارٍ تحميل تفاصيل المنتج">
          <View style={s.skeletonHero} />
          {[100, 65, 85].map((n) => (
            <View key={n} style={[s.skeletonLine, { width: `${n}%` }]} />
          ))}
          <View style={s.skeletonPrice} />
        </ScrollView>
      ) : !product ? (
        <View style={s.state}>
          <Icon name="cloud-off-outline" size={50} color={p.muted} />
          <Text accessibilityRole="alert" style={s.stateTitle}>
            {detail.failure.title}
          </Text>
          <Text style={s.stateText}>{detail.failure.message}</Text>
          <Button title="إعادة المحاولة" onPress={detail.refresh} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={s.page}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={detail.busy && !!product}
                onRefresh={detail.refresh}
                colors={[p.primary]}
                tintColor={p.primary}
              />
            }
          >
            <ProductMedia
              key={`${id}-${product.image}-${product.videoUrl}`}
              image={product.image}
              video={product.videoUrl}
              title={product.title}
              active={detail.active}
            />
            <View style={s.identity}>
              <View style={s.meta}>
                <Text style={s.category}>{product.categoryProvided ? product.category : ''}</Text>
                <View style={[s.stock, stock === 0 && s.out]}>
                  <View style={[s.dot, stock === 0 && { backgroundColor: '#A24B3F' }]} />
                  <Text style={[s.stockText, stock === 0 && { color: '#A24B3F' }]}>
                    {stock == null ? 'المخزون غير محدد' : stock > 0 ? 'متوفر' : 'نفدت الكمية'}
                  </Text>
                </View>
              </View>
              <Text accessibilityRole="header" style={s.title}>
                {product.title}
              </Text>
              <View style={s.codeRow}>
                <Text selectable style={s.code}>
                  كود المنتج: {id}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="نسخ كود المنتج"
                  onPress={copy}
                  style={s.iconButton}
                >
                  <Icon name="content-copy" size={19} color={p.muted} />
                </Pressable>
              </View>
              {!!copied && (
                <Text accessibilityLiveRegion="polite" style={s.feedback}>
                  {copied}
                </Text>
              )}
            </View>
            {!!detail.error && (
              <View style={s.error}>
                <Text accessibilityRole="alert" style={s.errorText}>
                  {detail.failure.title}. {detail.failure.message}
                </Text>
                <Button title="إعادة المحاولة" onPress={detail.refresh} secondary />
              </View>
            )}
            {detail.busy && !detail.error && (
              <View style={s.updating}>
                <ActivityIndicator size="small" color={p.primary} />
                <Text style={s.caption}>نحدّث السعر والمخزون…</Text>
              </View>
            )}
            <View style={[s.prices, compact && s.stacked]}>
              {merchant && (
                <View style={s.priceCell}>
                  <Text style={s.priceLabel}>سعرك كتاجر</Text>
                  <Text testID="detail-merchant-price" style={s.price}>
                    {formatMoney(detail.merchantPrice)}
                  </Text>
                </View>
              )}
              {merchant && <View style={compact ? s.dividerHorizontal : s.divider} />}
              <View style={s.priceCell}>
                <Text style={s.priceLabel}>سعر البيع المقترح</Text>
                <Text
                  testID="detail-suggested-price"
                  style={[s.price, merchant && s.secondaryPrice]}
                >
                  {formatMoney(detail.suggested)}
                </Text>
              </View>
            </View>
            <View style={s.quantitySection}>
              <Text style={s.sectionTitle}>الكمية المطلوبة</Text>
              <View style={s.stepper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تقليل الكمية"
                  disabled={detail.quantity <= (cart ? 0 : 1) || !detail.ready}
                  onPress={() => detail.change(-1)}
                  style={[
                    s.step,
                    (detail.quantity <= (cart ? 0 : 1) || !detail.ready) && s.disabled,
                  ]}
                >
                  <Icon name="minus" size={23} color={p.deep} />
                </Pressable>
                <Text accessibilityLiveRegion="polite" testID="detail-quantity" style={s.quantity}>
                  {detail.quantity}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="زيادة الكمية"
                  disabled={!detail.ready || stock == null || detail.quantity >= stock}
                  onPress={() => detail.change(1)}
                  style={[
                    s.step,
                    s.plus,
                    (!detail.ready || stock == null || detail.quantity >= stock) && s.disabled,
                  ]}
                >
                  <Icon name="plus" size={23} color="#fff" />
                </Pressable>
              </View>
              <Text style={s.centerCaption}>
                {stock == null ? 'الكمية المتاحة غير محددة' : `المتاح: ${stock} قطعة`}
              </Text>
              {!!cart && <Text style={s.centerCaption}>في السلة حاليًا: {cart.quantity} قطعة</Text>}
              {detail.unitPrice != null && (
                <Text style={s.centerCaption}>
                  سعر البيع في السلة: {formatMoney(detail.unitPrice)} · يمكن تعديله بالسلة
                </Text>
              )}
              {!!cart && detail.quantity !== cart.quantity && (
                <Text style={s.centerCaption}>
                  اضغط «{detail.quantity === 0 ? 'حذف من السلة' : 'تحديث السلة'}» لحفظ التغيير.
                </Text>
              )}
            </View>
            {!!detail.notice && (
              <View style={s.notice}>
                <Icon name="check-circle" size={22} color={p.primary} />
                <Text accessibilityLiveRegion="polite" style={s.noticeText}>
                  {detail.notice}
                </Text>
              </View>
            )}
            <View style={s.about}>
              <Text accessibilityRole="header" style={s.sectionTitle}>
                عن المنتج
              </Text>
              <Text
                selectable
                numberOfLines={!descriptionOpen && longDescription ? 4 : undefined}
                style={s.description}
              >
                {description || 'لم تتم إضافة وصف لهذا المنتج بعد.'}
              </Text>
              {longDescription && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={descriptionOpen ? 'عرض أقل' : 'عرض المزيد'}
                  aria-expanded={descriptionOpen}
                  onPress={() => setDescriptionOpen(!descriptionOpen)}
                  style={s.more}
                >
                  <Text style={s.moreText}>{descriptionOpen ? 'عرض أقل' : 'عرض المزيد'}</Text>
                  <Icon
                    name={descriptionOpen ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={p.primary}
                  />
                </Pressable>
              )}
              {!!date && <Text style={s.date}>آخر تحديث: {date}</Text>}
            </View>
          </ScrollView>
          <View style={[s.footer, compact && s.stacked]}>
            <View style={s.total}>
              <Text style={s.caption}>
                {detail.viewCart ? 'إجمالي المنتج في السلة' : 'إجمالي الإضافة'}
              </Text>
              <Text testID="detail-total" style={s.totalPrice}>
                {formatMoney(
                  detail.unitPrice == null
                    ? null
                    : Math.round(
                        detail.unitPrice *
                          (detail.viewCart ? cart!.quantity : detail.quantity) *
                          100,
                      ) / 100,
                )}
              </Text>
            </View>
            <Button
              title={footerTitle}
              icon="cart-outline"
              disabled={!detail.viewCart && !detail.canSave}
              onPress={detail.viewCart ? openCart : detail.save}
              style={s.footerButton}
            />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
