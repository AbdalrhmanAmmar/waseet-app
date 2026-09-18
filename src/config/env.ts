// Public API configuration only. Never put credentials in EXPO_PUBLIC_* variables.
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  'https://smart-broker-bcd9bzfvagd5f8dx.westus-01.azurewebsites.net/api/'
).replace(/\/?$/, '/');
export const PUSH_TOKEN_PATH = process.env.EXPO_PUBLIC_PUSH_TOKEN_PATH;
