import type { Order } from '@/types/models';
import { hasReference, type ExternalReturnInput } from './external-order-policy';
function storedAmount(value: unknown): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '')
    return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
export function externalReturnSummary(order: Order, input: ExternalReturnInput) {
  const pieces = input.items.reduce((sum, row) => sum + row.quantity, 0);
  const amount = (field: 'merchantProfitUSD' | 'adminProfitUSD') => {
    let sum = 0;
    for (const row of input.items) {
      const item = order.items.find((i) => Number(i.orderItemId) === row.orderItemId);
      const profit = storedAmount(item?.[field]),
        quantity = Number(item?.quantity);
      if (
        profit === null ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isSafeInteger(row.quantity) ||
        row.quantity <= 0 ||
        row.quantity > quantity
      )
        return null;
      sum += (profit / quantity) * row.quantity;
    }
    return Number.isFinite(sum) ? sum : null;
  };
  const merchantKnown =
    hasReference(order.userId) && storedAmount(order.totalMerchantProfitUSD) !== null;
  return {
    pieces,
    merchant: merchantKnown ? amount('merchantProfitUSD') : null,
    admin: amount('adminProfitUSD'),
    stock:
      order.isStockDecremented === true ? pieces : order.isStockDecremented === false ? 0 : null,
  };
}
