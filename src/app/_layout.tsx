import { baseApi } from '@/api/base-api';
import { toastConfig } from '@/components/shared/CustomToast';
import { useSession } from '@/hooks/shared/use-session';
import '@/locales';
import { clearScreenData } from '@/navigation/use-screen-props';
import { observeNotifications, registerPushToken } from '@/services/notifications';
import { store } from '@/store';
import { bootstrapSession, GetUserProfile } from '@/store/slices/auth';
import NetInfo from '@react-native-community/netinfo';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
void SplashScreen.preventAutoHideAsync();
export { ErrorBoundary } from 'expo-router';
function Navigation() {
  const { ready, userData, restricted } = useSession();
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-SemiBold': require('../../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Light': require('../../assets/fonts/Montserrat-Light.ttf'),
    'Montserrat-Black': require('../../assets/fonts/Montserrat-Black.ttf'),
    'Montserrat-Thin': require('../../assets/fonts/Montserrat-Thin.ttf'),
  });
  useEffect(() => {
    void store.dispatch(bootstrapSession());
  }, []);
  useEffect(() => {
    if (ready && (fontsLoaded || fontError)) void SplashScreen.hideAsync();
  }, [ready, fontsLoaded, fontError]);
  useEffect(() => {
    if (!userData?.userId) {
      clearScreenData();
      return;
    }
    void store.dispatch(GetUserProfile(userData.userId));
  }, [userData?.userId]);
  useEffect(
    () =>
      setupListeners(store.dispatch, (dispatch, actions) => {
        const appState = AppState.addEventListener('change', (state) =>
          dispatch(state === 'active' ? actions.onFocus() : actions.onFocusLost()),
        );
        const network = NetInfo.addEventListener((state) =>
          dispatch(state.isConnected !== false ? actions.onOnline() : actions.onOffline()),
        );
        return () => {
          appState.remove();
          network();
        };
      }),
    [],
  );
  useEffect(() => {
    if (!ready || !userData?.userId || restricted) return;
    let active = true;
    let cleanup = () => {};
    observeNotifications(
      () => {
        if (active) router.push('/account/notifications');
      },
      () => store.dispatch(baseApi.util.invalidateTags(['Notifications', 'Orders'])),
    )
      .then((dispose) => {
        if (active) cleanup = dispose;
        else dispose();
      })
      .catch(() => {});
    registerPushToken().catch(() => {
      Toast.show({ type: 'info', text1: 'تعذر تفعيل الإشعارات على الجهاز' });
    });
    return () => {
      active = false;
      cleanup();
    };
  }, [ready, userData?.userId, restricted]);
  if (!ready || (!fontsLoaded && !fontError)) return null;
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!userData}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!userData && restricted}>
          <Stack.Screen name="account-status" />
        </Stack.Protected>
        <Stack.Protected guard={!!userData && !restricted}>
          <Stack.Screen name="(protected)" />
        </Stack.Protected>
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <Navigation />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
