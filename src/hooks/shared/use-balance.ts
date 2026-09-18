import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSession } from './use-session';
import { useAppDispatch } from './use-store';
import { store } from '@/store';
import { GetUserProfile } from '@/store/slices/auth';
export function useBalance() {
  const session = useSession();
  const dispatch = useAppDispatch();
  const id = session.userData?.userId;
  const refresh = useCallback(async () => {
    if (id) await dispatch(GetUserProfile(id));
  }, [dispatch, id]);
  const refreshIfOld = useCallback(() => {
    const state = store.getState().AuthSlice;
    if (Date.now() - (state.profileUpdatedAt ?? 0) > 30000) void refresh();
  }, [refresh]);
  useFocusEffect(
    useCallback(() => {
      refreshIfOld();
      let previous = AppState.currentState;
      const listener = AppState.addEventListener('change', (next) => {
        if (next === 'active' && previous !== 'active') refreshIfOld();
        previous = next;
      });
      return () => listener.remove();
    }, [refreshIfOld]),
  );
  // Shared state keeps home/profile synchronized; request deduplication is in the auth thunk.
  return {
    user: session.userData,
    busy: session.profileStatus === 'loading',
    failed: session.profileStatus === 'error',
    refresh,
  };
}
