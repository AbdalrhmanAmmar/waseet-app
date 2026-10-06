import { API_URL } from '@/config/env';
import { accountReview } from '@/auth/account-review';
import type { ApiError } from '@/types/models';
import { create } from 'axios';
import { apiErrorMessage } from '@/domain/api-error-message';
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
    if (
      response.data?.isSuccess === false ||
      response.data?.success === false ||
      response.data?.status === 'error'
    ) {
      return Promise.reject({
        status: response.status,
        message: apiErrorMessage(response.data, 'رفض الخادم الطلب'),
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
      message: apiErrorMessage(
        data,
        error.response?.status === 405
          ? 'الخادم لا يسمح بطريقة الطلب على هذا المسار'
          : error.response
            ? 'رفض الخادم الطلب'
            : 'تعذر الاتصال بالخادم',
      ),
    } satisfies ApiError);
  },
);
