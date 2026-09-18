import { client } from '@/api/client';
import { PUSH_TOKEN_PATH } from '@/config/env';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
export async function observeNotifications(
  onOpen: () => void,
  onReceive: () => void,
): Promise<() => void> {
  if (Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient') return () => {};
  const notifications = await import('expo-notifications');
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  const opened = notifications.addNotificationResponseReceivedListener(() => {
    onOpen();
    void notifications.clearLastNotificationResponseAsync();
  });
  const received = notifications.addNotificationReceivedListener(onReceive);
  const initial = await notifications.getLastNotificationResponseAsync();
  if (initial) {
    onOpen();
    await notifications.clearLastNotificationResponseAsync();
  }
  return () => {
    opened.remove();
    received.remove();
  };
}
export async function registerPushToken() {
  if (!PUSH_TOKEN_PATH || Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient')
    return;
  const notifications = await import('expo-notifications');
  if (Platform.OS === 'android')
    await notifications.setNotificationChannelAsync('orders', {
      name: 'الطلبات',
      importance: notifications.AndroidImportance.HIGH,
    });
  const permission = await notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return;
  const token = await notifications.getDevicePushTokenAsync();
  // Native token: FCM on Android, APNs on iOS. Configure a matching backend adapter.
  await client.post(PUSH_TOKEN_PATH, { token: token.data, platform: Platform.OS });
}
