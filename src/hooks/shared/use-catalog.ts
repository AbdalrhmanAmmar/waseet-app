import { isMerchantRole } from '@/auth/roles';
import { useCatalogInfiniteQuery } from '@/api/shared/catalog';
import { useSession } from './use-session';
export function useCatalog() {
  const { userData, role } = useSession();
  // Product/all is the catalog for merchants, their employees and sales; the API layer
  // strips the prices each role may not see.
  const query = useCatalogInfiniteQuery(
    { userId: String(userData?.userId ?? ''), role: String(role ?? '') },
    { skip: !userData || !(isMerchantRole(role) || role === 'SalesEmployee') },
  );
  const nextPageError = query.isError && query.direction === 'forward';
  const data = [
    ...new Map(
      (query.currentData?.pages.flatMap((page) => page.items) ?? []).map((item) => [
        String(item.id),
        item,
      ]),
    ).values(),
  ];
  return {
    data,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    fetching: query.isFetching,
    error: query.error,
    nextPageError,
    retry: async () => {
      if (query.isFetching || query.isUninitialized) return;
      // Resume the failed page; refetching would request all loaded pages again.
      if (nextPageError) await query.fetchNextPage();
      else await query.refetch();
    },
    refresh: async () => {
      if (!query.isUninitialized && !query.isFetching) await query.refetch();
    },
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetching) void query.fetchNextPage();
    },
  };
}
export type CatalogController = ReturnType<typeof useCatalog>;
