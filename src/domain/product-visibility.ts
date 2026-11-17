import type { Product } from '@/types/models';
import { optionalPrice } from './product-details';

// What each role may see of a product, applied where products enter the app
// (Product/all and Product/{id}), so no screen can show a price the role must not see —
// even while the backend still returns it.
//
// - Merchant: everything, including their own merchantSellPrice.
// - MerchantEmployee: everything except the owner's merchantSellPrice.
// - SalesEmployee: identity, media, category, description, stock and expectedSellPrice only.
export const seesMerchantPrice = (role: unknown) => role === 'Merchant';

const MERCHANT_PRICE_KEYS = [
  'merchantSellPrice',
  'MerchantSellPrice',
  'merchant_sell_price',
  'merchantSellPriceUSD',
  'MerchantSellPriceUSD',
];

function withoutMerchantPrice(product: Product): Product {
  const merchantPrice = optionalPrice(product.merchantSellPrice);
  const copy: Product = { ...product };
  for (const key of MERCHANT_PRICE_KEYS) delete copy[key];
  // The normalizer falls back to merchantSellPrice for `price` when no expected price exists.
  const suggested =
    optionalPrice(product.effectiveExpectedSellPrice) ?? optionalPrice(product.expectedSellPrice);
  copy.price =
    suggested ??
    (merchantPrice != null && product.price === merchantPrice ? Number.NaN : product.price);
  return copy;
}

function salesProduct(product: Product): Product {
  const expectedSellPrice = optionalPrice(product.expectedSellPrice);
  // Whitelist: cost (originalPrice), merchant price and any other price never reach sales.
  return {
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    title: product.title,
    image: product.image,
    videoUrl: product.videoUrl,
    category: product.category,
    categoryProvided: product.categoryProvided,
    description: product.description,
    updatedAt: product.updatedAt,
    stock: product.stock,
    stockKnown: product.stockKnown,
    expectedSellPrice,
    price: expectedSellPrice ?? Number.NaN,
  };
}

export function productForRole(product: Product, role: unknown): Product {
  if (seesMerchantPrice(role)) return product;
  if (role === 'SalesEmployee') return salesProduct(product);
  return withoutMerchantPrice(product);
}
