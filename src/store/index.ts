import { baseApi } from '@/api/base-api';
import { configureSession } from '@/api/client';
import { storage } from '@/services/storage';
import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  isAnyOf,
} from '@reduxjs/toolkit';
import auth, {
  GetUserProfile,
  Login,
  bootstrapSession,
  logout,
  sessionError,
  setFirst,
} from './slices/auth';
import cart from './slices/cart';
const listener = createListenerMiddleware();
const reducers = combineReducers({ AuthSlice: auth, cart, [baseApi.reducerPath]: baseApi.reducer });
export const store = configureStore({
  reducer: (
    state: ReturnType<typeof reducers> | undefined,
    action: Parameters<typeof reducers>[1],
  ) => {
    if (logout.match(action)) {
      return reducers(
        {
          ...reducers(undefined, { type: 'reset' }),
          AuthSlice: {
            ...auth(undefined, { type: 'reset' }),
            ready: true,
            isFirst: state?.AuthSlice.isFirst ?? false,
          },
        },
        action,
      );
    }
    return reducers(state, action);
  },
  middleware: (defaults) => defaults().prepend(listener.middleware).concat(baseApi.middleware),
});
configureSession(null, () => store.dispatch(logout()));
store.subscribe(() => configureSession(store.getState().AuthSlice.userData?.token ?? null));
listener.startListening({
  matcher: isAnyOf(logout, GetUserProfile.fulfilled, Login.fulfilled, bootstrapSession.fulfilled),
  effect: async () => {
    try {
      await storage.saveSession(store.getState().AuthSlice.userData);
    } catch {
      store.dispatch(sessionError('تعذر حفظ الجلسة على الجهاز'));
    }
  },
});
listener.startListening({
  actionCreator: setFirst,
  effect: async () => {
    await storage.completeOnboarding();
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
