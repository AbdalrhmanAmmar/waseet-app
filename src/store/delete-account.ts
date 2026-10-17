import { createAsyncThunk } from '@reduxjs/toolkit';
import { client } from '@/api/client';
import { logout } from './slices/auth';
import type { RootState } from './index';
import type { ApiError } from '@/types/models';
let deleting = false;
// No caller-supplied ID: only the currently authenticated account can be deleted.
export const deleteOwnAccount = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: ApiError }
>(
  'auth/deleteOwnAccount',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const user = getState().AuthSlice.userData;
    if (!user?.token || !user.userId)
      return rejectWithValue({ status: 401, message: 'سجل الدخول لحذف حسابك.' });
    deleting = true;
    try {
      await client.delete(`User/${encodeURIComponent(user.userId)}`);
      if (getState().AuthSlice.userData?.token === user.token) dispatch(logout());
    } catch (error) {
      const failure = error as ApiError;
      return rejectWithValue({
        status: failure.status ?? 'NETWORK_ERROR',
        message: failure.message || 'تعذر حذف الحساب',
      });
    } finally {
      deleting = false;
    }
  },
  { condition: () => !deleting },
);
