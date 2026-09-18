import { unavailableMessages } from '@/config/features';
import { client } from '../client';
export const authApi = {
  login: (data: { email: string; password: string }) =>
    client.post('Auth/login', data).then((r) => r.data),
  register: (data: Record<string, unknown>) =>
    client.post('Auth/register', data).then((r) => r.data),
  requestReset: (_data: { email: string }) =>
    Promise.reject(new Error(unavailableMessages.passwordReset)),
  verifyReset: (_data: { email: string; otp: string }) =>
    Promise.reject(new Error(unavailableMessages.passwordReset)),
  resetPassword: (_data: {
    email: string;
    otp: string;
    password: string;
    confirmPassword: string;
  }) => Promise.reject(new Error(unavailableMessages.passwordReset)),
};
