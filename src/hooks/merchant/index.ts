import { useMerchantOrdersQuery, useMerchantPricesQuery } from '@/api/merchant';
import { useCatalog } from '../shared/use-catalog';
import { useOrderList } from '../shared/use-order-list';
import { useSession } from '../shared/use-session';
export function useMerchantCatalog() {
  const { userData } = useSession();
  const prices = useMerchantPricesQuery(userData?.priceListId ?? '', {
    skip: !userData?.priceListId,
  });
  const catalog = useCatalog();
  const byCode = new Map((prices.data ?? []).map((item) => [String(item.productCode), item]));
  return {
    ...catalog,
    error: catalog.error ?? prices.error,
    data: catalog.data.map((item) => {
      const price = byCode.get(String(item.productCode));
      return price
        ? {
            ...item,
            merchantSellPrice: price.merchantSellPrice,
            effectiveExpectedSellPrice:
              price.effectiveExpectedSellPrice ?? item.effectiveExpectedSellPrice,
            price: price.effectiveExpectedSellPrice ?? item.price,
          }
        : item;
    }),
    refresh: async () => {
      await catalog.refresh();
      if (userData?.priceListId) await prices.refetch();
    },
  };
}
export function useMerchantOrders() {
  return useOrderList(useMerchantOrdersQuery);
}
