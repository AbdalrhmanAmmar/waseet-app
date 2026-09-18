import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { GetUserProfile } from '@/store/slices/auth';
import { useSession } from './use-session';
import { useAppDispatch } from './use-store';
export function useAccountStatus() {
  const { userData } = useSession();
  const dispatch = useAppDispatch();
  const userId = userData?.userId;
  const activeRequest = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!userId || activeRequest.current) return;
    activeRequest.current = true;
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await dispatch(GetUserProfile(userId)).unwrap();
      setFeedback('تم تحديث حالة حسابك.');
    } catch {
      setError('تعذر تحديث حالة الحساب. تحقق من اتصالك وحاول مرة أخرى.');
    } finally {
      activeRequest.current = false;
      setBusy(false);
    }
  }, [dispatch, userId]);
  useEffect(() => {
    if (!userId) return;
    let previous = AppState.currentState;
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active' && previous !== 'active') void refresh();
      previous = state;
    });
    // AppState covers native and browser visibility; focus covers returning from a support tab.
    const onFocus = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    if (Platform.OS === 'web') window.addEventListener('focus', onFocus);
    return () => {
      listener.remove();
      if (Platform.OS === 'web') window.removeEventListener('focus', onFocus);
    };
  }, [refresh, userId]);
  return { userData, busy, feedback, error, refresh };
}
