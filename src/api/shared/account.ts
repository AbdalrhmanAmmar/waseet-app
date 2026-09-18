import type { Id, Product } from '@/types/models';
import { unavailableMessages } from '@/config/features';
import { baseApi } from '../base-api';
// Preserve the screen adapters without calling legacy PHP endpoints on the new server.
const unavailable = (message: string) => ({ error: { status: 'UNAVAILABLE', message } });
export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    favorites: build.query<Product[], Id>({
      queryFn: () => unavailable(unavailableMessages.favorites),
      providesTags: ['Favorites'],
    }),
    toggleFavorite: build.mutation<unknown, { user_id: Id; product_id: Id }>({
      queryFn: () => unavailable(unavailableMessages.favorites),
      invalidatesTags: ['Favorites'],
    }),
    notifications: build.query<Record<string, any>[], Id>({
      queryFn: () => unavailable(unavailableMessages.notificationHistory),
      providesTags: ['Notifications'],
    }),
  }),
});
export const { useFavoritesQuery, useToggleFavoriteMutation, useNotificationsQuery } = accountApi;
