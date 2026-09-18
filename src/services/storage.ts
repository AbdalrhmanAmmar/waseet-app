import type { User } from '@/types/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const TOKEN_KEY = 'waseet.session.token';
const USER_KEY = 'waseet.session.user';
let webToken: string | null = null;
let writes = Promise.resolve();
// Web tokens remain in memory. Native tokens are stored in the OS keychain/keystore.
export const storage = {
  async loadSession(): Promise<User | null> {
    await writes;
    const token = Platform.OS === 'web' ? webToken : await SecureStore.getItemAsync(TOKEN_KEY);
    const value = await AsyncStorage.getItem(USER_KEY);
    if (!token || !value) return null;
    try {
      return { ...JSON.parse(value), token };
    } catch {
      return null;
    }
  },
  saveSession(user: User | null): Promise<void> {
    const operation = async () => {
      if (Platform.OS === 'web') webToken = user?.token ?? null;
      else if (user) await SecureStore.setItemAsync(TOKEN_KEY, user.token);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
      if (user) {
        const { token: _token, ...profile } = user;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      } else await AsyncStorage.removeItem(USER_KEY);
    };
    writes = writes.catch(() => {}).then(operation);
    return writes;
  },
  async isFirstLaunch() {
    return (await AsyncStorage.getItem('waseet.onboarded')) !== 'true';
  },
  completeOnboarding() {
    return AsyncStorage.setItem('waseet.onboarded', 'true');
  },
};
