import type { ApiError } from '@/types/models';
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosRequestConfig } from 'axios';
import { client } from './client';
const baseQuery: BaseQueryFn<AxiosRequestConfig, unknown, ApiError> = async (args, api) => {
  try {
    return { data: (await client({ ...args, signal: api.signal })).data };
  } catch (error) {
    return { error: error as ApiError };
  }
};
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Products', 'Orders', 'Profile', 'Favorites', 'Notifications'],
  endpoints: () => ({}),
});
