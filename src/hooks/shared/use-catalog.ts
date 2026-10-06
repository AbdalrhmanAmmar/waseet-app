import { useCatalogInfiniteQuery } from '@/api/shared/catalog';
import { useSalesOrderOptionsQuery } from '@/api/sales-employee';
import { useSession } from './use-session';
export function useCatalog() {
  const { userData, role } = useSession();
  const isSales = role === 'SalesEmployee';
  const query = useCatalogInfiniteQuery(String(userData?.userId ?? ''), {
    skip: !userData || role !== 'Merchant',
  });
  const sales = useSalesOrderOptionsQuery(String(userData?.userId ?? ''), {
    skip: !userData || !isSales,
    refetchOnMountOrArgChange: true,
  });
  const nextPageError = query.isError && query.direction === 'forward';
  const data = [
    ...new Map(
      (query.currentData?.pages.flatMap((page) => page.items) ?? []).map((item) => [
        String(item.id),
        item,
      ]),
    ).values(),
  ];
  if (isSales)
    return {
      data: sales.currentData ?? [],
      loading: sales.isLoading,
      loadingMore: false,
      hasMore: false,
      fetching: sales.isFetching,
      error: sales.error,
      nextPageError: false,
      retry: async () => {
        if (!sales.isUninitialized && !sales.isFetching) await sales.refetch();
      },
      refresh: async () => {
        if (!sales.isUninitialized && !sales.isFetching) await sales.refetch();
      },
      totalCount: sales.currentData?.length ?? 0,
      loadMore: () => {},
    };
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
