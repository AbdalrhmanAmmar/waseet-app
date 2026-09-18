import type { Order, Page, PageParams, Product } from '@/types/models';
import { mediaUrl, optionalPrice } from '@/domain/product-details';
type Raw = Record<string, any>;
export function unwrap(value: unknown): any {
  const body = value as Raw | null;
  return body?.data ?? value;
}
export function list(value: unknown): Raw[] {
  const body = unwrap(value);
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.message)) return body.message;
  return [];
}
export function page<T>(value: unknown, params: PageParams, map: (item: Raw) => T): Page<T> {
  const body = unwrap(value);
  const items = list(value).map(map);
  const pageSize = Number(body?.pageSize ?? params.pageSize ?? 20);
  const totalCount = Number(body?.totalCount ?? items.length);
  return {
    items,
    page: Number(body?.page ?? params.page ?? 1),
    pageSize,
    totalCount,
    totalPages: Number(body?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize))),
  };
}
export function product(item: Raw): Product {
  return {
    ...item,
    id: item.productCode ?? item.id ?? item.product_id,
    productCode: item.productCode ?? item.id ?? item.product_id,
    name:
      item.name ??
      item.productName ??
      item.title ??
      item.product_title ??
      item.product_name ??
      'منتج',
    title:
      item.name ??
      item.productName ??
      item.title ??
      item.product_title ??
      item.product_name ??
      'منتج',
    price:
      optionalPrice(item.effectiveExpectedSellPrice) ??
      optionalPrice(item.expectedSellPrice) ??
      optionalPrice(item.merchantSellPrice) ??
      optionalPrice(item.price) ??
      optionalPrice(item.product_price) ??
      Number.NaN,
    merchantSellPrice: optionalPrice(item.merchantSellPrice) ?? undefined,
    effectiveExpectedSellPrice: optionalPrice(item.effectiveExpectedSellPrice) ?? undefined,
    category: item.categoryName ?? item.category ?? 'عام',
    categoryProvided: item.categoryProvided ?? !!(item.categoryName ?? item.category),
    stockKnown: item.stockKnown ?? (item.quantity != null || item.stock != null),
    expectedSellPrice: optionalPrice(item.expectedSellPrice),
    videoUrl: mediaUrl(item.videoUrl),
    description:
      typeof (item.description ?? item.productDescription) === 'string'
        ? (item.description ?? item.productDescription)
        : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    stock: Number(item.stock ?? item.quantity ?? 0),
    image: mediaUrl(item.imageUrl ?? item.imagePath ?? item.image ?? item.product_image),
  };
}
export function order(item: Raw): Order {
  return {
    ...item,
    orderId: item.orderId ?? item.id ?? item.order_id,
    customerName: item.customerName ?? item.customer ?? '',
    status: item.status ?? item.orderStatus ?? '',
    orderTotalUSD: Number(item.orderTotalUSD ?? item.totalPrice ?? item.totalAmount ?? 0),
    deliveryFee: Number(item.deliveryFee ?? item.fee ?? 0),
    items: item.items ?? item.orderItems ?? [],
  };
}
export function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  const value = error as Raw | null;
  return value?.message ?? value?.data?.message ?? 'تعذر إتمام الطلب. حاول مرة أخرى.';
}
