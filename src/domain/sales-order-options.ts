import type { Product } from '@/types/models';
import { optionalPrice } from './product-details';

// Whitelist this contract: merchant pricing and catalog stock are not sales order options.
export function salesOrderOptions(value: unknown): Product[] {
  const body = value && typeof value === 'object' && 'data' in value ? value.data : value;
  if (!Array.isArray(body)) throw new Error('بيانات خيارات المنتجات غير صالحة');
  const products = body.map((item): Product => {
    if (
      !item ||
      !Number.isSafeInteger(item.productCode) ||
      item.productCode <= 0 ||
      typeof item.name !== 'string' ||
      !item.name.trim()
    )
      throw new Error('بيانات أحد المنتجات غير صالحة');
    const expectedSellPrice = optionalPrice(item.expectedSellPrice);
    const effectiveExpectedSellPrice = optionalPrice(item.effectiveExpectedSellPrice) ?? undefined;
    return {
      id: item.productCode,
      productCode: item.productCode,
      name: item.name,
      title: item.name,
      originalPrice: optionalPrice(item.originalPrice),
      expectedSellPrice,
      effectiveExpectedSellPrice,
      price: effectiveExpectedSellPrice ?? expectedSellPrice ?? Number.NaN,
      category: '',
      categoryProvided: false,
      stock: Number.NaN,
      stockKnown: false,
    };
  });
  return [...new Map(products.map((item) => [item.productCode, item])).values()];
}
