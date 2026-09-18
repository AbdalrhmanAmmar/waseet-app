import { client } from '@/api/client';
import { errorMessage, unwrap } from '@/api/normalizers';
import { authApi } from '@/api/shared/auth';
import { normalizeUser } from '@/auth/session';
import { storage } from '@/services/storage';
import type { ApiError, Id, User } from '@/types/models';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
interface AuthState {
  userData: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  ready: boolean;
  isFirst: boolean;
  error: string | null;
}
const initialState: AuthState = {
  userData: null,
  isLoggedIn: false,
  isLoading: false,
  ready: false,
  isFirst: true,
  error: null,
};
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async () => {
  const isFirst = await storage.isFirstLaunch();
  const saved = await storage.loadSession();
  if (!saved) return { isFirst, user: null };
  try {
    return { isFirst, user: normalizeUser(saved) };
  } catch {
    await storage.saveSession(null);
    return { isFirst, user: null };
  }
});
export const Login = createAsyncThunk(
  'auth/login',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.login(data);
      const body = unwrap(res);
      const user = normalizeUser({ ...(body.user ?? body), token: body.token ?? body.user?.token });
      await storage.saveSession(user);
      return { ...res, isSuccess: true, user };
    } catch (error) {
      return rejectWithValue({
        message: errorMessage(error),
        accountReview: (error as ApiError | null)?.accountReview,
      });
    }
  },
);
export const SignUp = createAsyncThunk(
  'auth/register',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      return await authApi.register(data);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const ResetPasswordRequest = createAsyncThunk(
  'auth/requestReset',
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      return await authApi.requestReset(data);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const GetUserProfile = createAsyncThunk(
  'auth/profile',
  async (id: Id, { rejectWithValue, getState }) => {
    try {
      const previous = (getState() as { AuthSlice: AuthState }).AuthSlice.userData;
      return normalizeUser(
        unwrap((await client.get(`User/${encodeURIComponent(id)}`)).data),
        previous,
      );
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
export const UpdateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, data }: { userId: Id; data: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      return (await client.put(`User/${encodeURIComponent(userId)}`, data)).data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.userData = null;
      state.isLoggedIn = false;
      state.isLoading = false;
      state.error = null;
    },
    setFirst: (state) => {
      state.isFirst = false;
    },
    sessionError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, { payload }) => {
        state.ready = true;
        state.isFirst = payload.isFirst;
        state.userData = payload.user;
        state.isLoggedIn = !!payload.user;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.ready = true;
      })
      .addCase(Login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(Login.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.userData = payload.user;
        state.isLoggedIn = true;
      })
      .addCase(Login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = errorMessage(action.payload ?? action.error);
      })
      .addCase(GetUserProfile.fulfilled, (state, { payload, meta }) => {
        // Ignore responses belonging to a session that has since been signed out/switched.
        if (
          String(state.userData?.userId) === String(meta.arg) &&
          state.userData?.token === payload.token
        )
          state.userData = payload;
      });
    for (const action of [SignUp, ResetPasswordRequest]) {
      builder.addCase(action.pending, (state) => {
        state.isLoading = true;
      });
      builder.addCase(action.fulfilled, (state) => {
        state.isLoading = false;
      });
      builder.addCase(action.rejected, (state) => {
        state.isLoading = false;
      });
    }
  },
});
export const { logout, setFirst, sessionError } = slice.actions;
export default slice.reducer;
