import type { Order, Page } from '@/types/models';
import { useSession } from './use-session';
type QueryHook = (key: string) => {
  data?: { pages: Page<Order>[] };
  isFetching: boolean;
  isLoading: boolean;
  error?: unknown;
  refetch: () => unknown;
  hasNextPage: boolean;
  fetchNextPage: () => unknown;
};
export function useOrderList(useQuery: QueryHook) {
  const { userData } = useSession();
  const result = useQuery(String(userData?.userId ?? ''));
  const orders = [
    ...new Map(
      (result.data?.pages.flatMap((page) => page.items) ?? []).map((item) => [
        String(item.orderId),
        item,
      ]),
    ).values(),
  ];
  return {
    orders,
    error: result.error,
    loading: result.isLoading,
    fetching: result.isFetching,
    refresh: () => {
      result.refetch();
    },
    loadMore: () => {
      if (!result.isFetching && result.hasNextPage) result.fetchNextPage();
    },
  };
}
