import { API_URL } from '@/config/env';
import { accountReview } from '@/auth/account-review';
import type { ApiError } from '@/types/models';
import { create } from 'axios';
export const client = create({ baseURL: API_URL, timeout: 20000 });
let token: string | null = null;
let onUnauthorized = () => {};
export function configureSession(value: string | null, handler?: () => void) {
  token = value;
  if (handler) onUnauthorized = handler;
}
client.interceptors.request.use((config) => {
  if (token && !config.url?.startsWith('Auth/')) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(
  (response) => {
    if (response.data?.isSuccess === false || response.data?.status === 'error') {
      return Promise.reject({
        status: response.status,
        message: response.data.message ?? 'رفض الخادم الطلب',
        ...(response.config.url === 'Auth/login' && {
          accountReview: accountReview(response.data),
        }),
      } satisfies ApiError);
    }
    return response;
  },
  (error) => {
    // A failed login must not invalidate an unrelated session.
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('Auth/') &&
      error.config?.headers?.Authorization === `Bearer ${token}`
    )
      onUnauthorized();
    const data = error.response?.data;
    return Promise.reject({
      status: error.response?.status ?? 'NETWORK_ERROR',
      ...(error.config?.url === 'Auth/login' && { accountReview: accountReview(data) }),
      message:
        data?.message ??
        data?.title ??
        (typeof data === 'string' ? data : null) ??
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ??
        'تعذر الاتصال بالخادم',
    } satisfies ApiError);
  },
);
