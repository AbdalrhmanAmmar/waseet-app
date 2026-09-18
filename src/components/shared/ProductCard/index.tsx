import { styles } from '@/components/shared/ProductCard/styles';
import { ScreenNames } from '@/navigation/ScreenNames';
import { useScreenProps } from '@/navigation/use-screen-props';
import { COLORS, hp, Images } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useSelector } from 'react-redux';

const ProductCard = ({ item, index, onPress, onAddToCart, style }: any) => {
  const { navigation } = useScreenProps();
  const isFree = !item.price || parseFloat(item.price) === 0;
  const { userData } = useSelector((state: any) => state.AuthSlice);
  const { userCart } = useSelector((state: any) => state.cart);

  const itemCode = String(item.productCode || item.id || item.cart_id);
  const isAdded = (userCart?.data || []).some(
    (c: any) => String(c.productCode || c.id || c.cart_id) === itemCode,
  );

  const isOutOfStock = item.quantity === 0 || item.stock === 0;

  const handleAddToCart = () => {
    if (userData?.isGuest) {
      navigation.navigate(ScreenNames.AuthStack, { screen: ScreenNames.Login });
      return;
    }
    if (onAddToCart) {
      onAddToCart();
    }
  };

  const displayPrice =
    item.effectiveExpectedSellPrice !== undefined ? item.effectiveExpectedSellPrice : item.price;

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={600}
      style={[styles.card, style]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={styles.imageContainer}>
          <Image
            source={item.image ? { uri: item.image } : Images.logoSelling}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <View
              style={[
                styles.accessBadge,
                { right: hp(0.9), left: undefined, backgroundColor: '#EF4444' },
              ]}
            >
              <Icon name="alert-circle-outline" size={hp(1.2)} color="#FFF" />
              <Text style={styles.accessBadgeText}>نفدت الكمية</Text>
            </View>
          )}

          {/* Price Tag */}
          {!isFree && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{displayPrice} $</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {item.author}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description || 'لا يوجد وصف لهذا المنتج.'}
          </Text>

          {/* Price Area */}
          <View style={styles.pricesContainer}>
            <View style={styles.suggestedPriceRow}>
              <Text style={styles.suggestedPriceLabel}>سعر البيع المقترح:</Text>
              <Text style={styles.suggestedPriceValue}>
                {item.effectiveExpectedSellPrice !== undefined &&
                item.effectiveExpectedSellPrice !== null
                  ? item.effectiveExpectedSellPrice
                  : item.price}{' '}
                $
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.addBtn,
                {
                  backgroundColor: isAdded
                    ? COLORS.mainOrange
                    : isOutOfStock
                      ? '#94A3B8'
                      : COLORS.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`إضافة ${item.title} للسلة`}
              disabled={isOutOfStock}
              onPress={handleAddToCart}
            >
              <Icon name={isAdded ? 'cart-check' : 'plus'} size={hp(1.9)} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
};

export default ProductCard;
