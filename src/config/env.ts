// Public API configuration only. Never put credentials in EXPO_PUBLIC_* variables.
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  'https://waseet-backend-hue2e5apaygdc3hp.westus2-01.azurewebsites.net/api/'
).replace(/\/?$/, '/');
export const PUSH_TOKEN_PATH = process.env.EXPO_PUBLIC_PUSH_TOKEN_PATH;
