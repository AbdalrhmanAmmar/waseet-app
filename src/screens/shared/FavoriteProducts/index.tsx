import { backendFeatures, unavailableMessages } from '@/config/features';
import { UnavailableFeature } from '@/components/shared/UnavailableFeature';
import { errorMessage } from '@/api/normalizers';
import { useFavoritesQuery, useToggleFavoriteMutation } from '@/api/shared/account';
import { CustomText, HeaderComponent, ScreenContainer } from '@/components/shared';
import { AsyncState } from '@/components/shared/AsyncState';
import ProductCard from '@/components/shared/ProductCard';
import { useSession } from '@/hooks/shared/use-session';
import { useAppDispatch } from '@/hooks/shared/use-store';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { addToCartLocal } from '@/store/slices/cart';
import { Alert, FlatList, Pressable, View } from 'react-native';
export default function FavoriteProducts({ navigation }: ScreenProps) {
  const { userData } = useSession();
  const dispatch = useAppDispatch();
  const query = useFavoritesQuery(userData?.userId ?? '', {
    skip: !userData || !backendFeatures.favorites,
  });
  const [toggle, result] = useToggleFavoriteMutation();
  if (!backendFeatures.favorites)
    return <UnavailableFeature title="المفضلة" message={unavailableMessages.favorites} />;
  return (
    <ScreenContainer>
      <HeaderComponent title="المفضلة" />
      <AsyncState loading={query.isLoading} error={query.error} onRetry={query.refetch} />
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshing={query.isFetching}
        onRefresh={query.refetch}
        ListEmptyComponent={
          !query.isLoading && !query.error ? <AsyncState empty="لا توجد منتجات مفضلة" /> : null
        }
        renderItem={({ item, index }) => (
          <View style={{ flex: 1 }}>
            <ProductCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('ProductDetails', { product: item })}
              onAddToCart={() => dispatch(addToCartLocal(item))}
            />
            <Pressable
              disabled={result.isLoading}
              onPress={async () => {
                if (!userData) return;
                try {
                  await toggle({ user_id: userData.userId, product_id: item.id }).unwrap();
                } catch (error) {
                  Alert.alert('تعذر التحديث', errorMessage(error));
                }
              }}
            >
              <CustomText>إزالة من المفضلة</CustomText>
            </Pressable>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
