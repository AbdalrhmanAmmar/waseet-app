// Sales employees browse and order from the shared catalog (Product/all, Product/{id});
// the API layer filters every product down to expectedSellPrice for this role.
export {
  useCreateOrderMutation as useSalesCreateOrderMutation,
  useOrderFeedInfiniteQuery as useSalesOrdersQuery,
} from '../shared/orders';
