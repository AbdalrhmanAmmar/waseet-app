// Sales shares the authenticated catalog/order contracts; no duplicated endpoints.
export { useProductsQuery as useSalesProductsQuery } from '../shared/catalog';
export {
  useCreateOrderMutation as useSalesCreateOrderMutation,
  useOrderFeedInfiniteQuery as useSalesOrdersQuery,
} from '../shared/orders';
