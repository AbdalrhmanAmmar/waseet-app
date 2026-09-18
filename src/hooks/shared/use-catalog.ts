import { useCatalogInfiniteQuery } from '@/api/shared/catalog';
import { useSession } from './use-session';
export function useCatalog() {
  const { userData } = useSession();
  const query = useCatalogInfiniteQuery(String(userData?.userId ?? ''), { skip: !userData });
  const data = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.items) ?? []).map((item) => [
        String(item.id),
        item,
      ]),
    ).values(),
  ];
  return {
    data,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error,
    refresh: async () => {
      await query.refetch();
    },
    totalCount: query.data?.pages[0]?.totalCount ?? 0,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetching) void query.fetchNextPage();
    },
  };
}
export type CatalogController = ReturnType<typeof useCatalog>;
