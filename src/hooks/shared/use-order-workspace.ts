import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Order, Page } from '@/types/models';
export function useOrderWorkspace(query: {
  currentData?: { pages: Page<Order>[] };
  hasNextPage: boolean;
  isFetching: boolean;
  isError: boolean;
  isLoading: boolean;
  isUninitialized: boolean;
  error?: unknown;
  direction?: 'forward' | 'backward';
  fetchNextPage: () => unknown;
  refetch: () => unknown;
}) {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    if (focused && query.hasNextPage && !query.isFetching && !query.isError)
      void query.fetchNextPage();
  }, [focused, query]);
  const orders = [
    ...new Map(
      (query.currentData?.pages.flatMap((p) => p.items) ?? []).map((item) => [
        String(item.orderId),
        item,
      ]),
    ).values(),
  ];
  const nextPageError = query.isError && query.direction === 'forward';
  return {
    orders,
    loading: query.isLoading,
    fetching: query.isFetching,
    error: query.error,
    hasMore: !!query.hasNextPage,
    complete: !!query.currentData && !query.hasNextPage && !query.isError,
    nextPageError,
    refresh: async () => {
      if (!query.isUninitialized && !query.isFetching) await query.refetch();
    },
    retry: () => {
      if (query.isUninitialized || query.isFetching) return;
      if (nextPageError) void query.fetchNextPage();
      else void query.refetch();
    },
  };
}
