import { rolePaths } from '@/auth/roles';
import { useSession } from '@/hooks/shared/use-session';
import { store } from '@/store';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
type Params = Record<string, any>;
// Preserve rich screen data in memory, never in a deep-link URL.
const screenData = new Map<string, Params>();
let serial = 0;
export function clearScreenData() {
  screenData.clear();
}
export function useScreenProps() {
  const router = useRouter();
  const search = useLocalSearchParams();
  const { role } = useSession();
  const navigation = useMemo(() => {
    function resolve(name: string, params: Params = {}): Href {
      if (params.screen) return resolve(params.screen, params.params ?? {});
      const currentRole = store.getState().AuthSlice.userData?.role ?? role;
      const base = currentRole ? rolePaths[currentRole] : '/';
      const paths: Record<string, string> = {
        AuthStack: '/login',
        Login: '/login',
        SignUp: '/register',
        Onboarding: '/onboarding',
        ForgetPasswordFlow: '/forgot-password',
        BottomTabs: base,
        AppStack: base,
        HomeScreen: base,
        ProductsScreen: `${base}/products`,
        CartScreen: `${base}/cart`,
        MyOrders:
          currentRole === 'ManagementEmployee' || currentRole === 'DeliveryAgent'
            ? base
            : `${base}/orders`,
        ProfileScreen: `${base}/profile`,
        MenuStack: '/account/menu',
        MenuScreen: '/account/menu',
        CheckoutScreen: `${base}/checkout`,
        OrderSuccess: `${base}/order-success`,
        ProductDetails: `${base}/product`,
        OrderDetails: `${base}/order`,
        TrackOrder: `${base}/track`,
        EditProfileScreen: '/account/edit-profile',
        Notifications: '/account/notifications',
        FavoriteProducts: `${base}/favorites`,
        ContactUs: '/account/contact',
        AboutUs: '/account/about',
      };
      const pathname = paths[name];
      if (!pathname) throw new Error(`Unknown screen: ${name}`);
      const key = String(++serial);
      screenData.set(key, params);
      if (screenData.size > 100) screenData.delete(screenData.keys().next().value!);
      const id =
        params.orderId ?? params.order_id ?? params.product?.productCode ?? params.product?.id;
      return {
        pathname,
        params: { _state: key, ...(id != null ? { id: String(id) } : {}) },
      } as Href;
    }
    return {
      navigate: (name: string, params?: Params) => router.navigate(resolve(name, params)),
      push: (name: string, params?: Params) => router.push(resolve(name, params)),
      replace: (name: string, params?: Params) => router.replace(resolve(name, params)),
      goBack: () => (router.canGoBack() ? router.back() : router.replace('/')),
      reset: ({ routes }: { index?: number; routes: { name: string; params?: Params }[] }) =>
        router.replace(resolve(routes[0].name, routes[0].params)),
    };
  }, [router, role]);
  const payload = screenData.get(String(search._state)) ?? {};
  return {
    navigation,
    route: {
      params: {
        ...search,
        ...(search.id ? { orderId: search.id, order_id: search.id } : {}),
        ...payload,
      } as Params,
    },
  };
}
export type ScreenProps = ReturnType<typeof useScreenProps>;
