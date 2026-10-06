import type { Order, Page, PageParams, Product, DeliveryArea } from '@/types/models';
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
function firstDefined(source: Raw, keys: string[]) {
  return keys.map((key) => source[key]).find((value) => value !== undefined);
}
function routingValue(item: Raw, keys: string[], nestedKeys = keys) {
  const direct = firstDefined(item, keys);
  if (direct !== undefined) return direct;
  const nested =
    item.olivery && typeof item.olivery === 'object' && !Array.isArray(item.olivery)
      ? firstDefined(item.olivery, nestedKeys)
      : undefined;
  return nested;
}
export function order(item: Raw): Order {
  const rawId = routingValue(
    item,
    ['oliveryOrderId', 'olivery_order_id', 'OliveryOrderId'],
    ['oliveryOrderId', 'olivery_order_id', 'OliveryOrderId', 'orderId', 'order_id'],
  );
  const reference = (value: unknown) =>
    typeof value === 'string' || typeof value === 'number' || value === null ? value : undefined;
  const optionalText = (value: unknown) =>
    typeof value === 'string' || value === null ? value : undefined;
  const flag = (keys: string[]) => {
    const value = firstDefined(item, keys);
    return typeof value === 'boolean' ? value : undefined;
  };
  return {
    ...item,
    userId: item.userId ?? item.UserId,
    orderType: item.orderType ?? item.order_type ?? item.OrderType,
    deliveryMode: item.deliveryMode ?? item.delivery_mode ?? item.DeliveryMode,
    oliveryOrderId: reference(
      rawId !== undefined ? rawId : item.olivery === null ? null : undefined,
    ),
    oliverySequence: reference(
      routingValue(
        item,
        ['oliverySequence', 'olivery_sequence', 'OliverySequence'],
        ['oliverySequence', 'olivery_sequence', 'OliverySequence', 'sequence', 'Sequence'],
      ),
    ),
    oliveryStatus: optionalText(
      routingValue(
        item,
        ['oliveryStatus', 'olivery_status', 'OliveryStatus'],
        ['oliveryStatus', 'olivery_status', 'OliveryStatus', 'status', 'Status'],
      ),
    ),
    deliveryStatus: optionalText(
      firstDefined(item, ['deliveryStatus', 'delivery_status', 'DeliveryStatus']),
    ),
    isReturnProcessed: flag(['isReturnProcessed', 'is_return_processed', 'IsReturnProcessed']),
    canProcessReturn: flag(['canProcessReturn', 'can_process_return', 'CanProcessReturn']),
    assignedToEmployeeId: firstDefined(item, ['assignedToEmployeeId', 'AssignedToEmployeeId']),
    assignedToDeliveryAgentId: item.assignedToDeliveryAgentId ?? item.AssignedToDeliveryAgentId,
    isReturnFinalized: flag(['isReturnFinalized', 'is_return_finalized', 'IsReturnFinalized']),
    originalOrderId: item.originalOrderId ?? item.original_order_id ?? item.OriginalOrderId,
    orderId: item.orderId ?? item.id ?? item.order_id,
    customerName: item.customerName ?? item.customer ?? '',
    secondCustomerPhone:
      item.secondCustomerPhone ?? item.second_customer_phone ?? item.secondPhone ?? null,
    status: item.status ?? item.orderStatus ?? '',
    orderTotalUSD: Number(item.orderTotalUSD ?? item.totalPrice ?? item.totalAmount ?? 0),
    deliveryFee: Number(item.deliveryFee ?? item.fee ?? 0),
    items: (item.items ?? item.orderItems ?? []).map((row: Raw) => ({
      ...row,
      orderItemId: row.orderItemId ?? row.order_item_id,
      originalOrderItemId:
        row.originalOrderItemId ?? row.original_order_item_id ?? row.OriginalOrderItemId,
      returnedQuantity: row.returnedQuantity ?? row.returned_quantity ?? null,
    })),
  };
}
export function orderDetails(value: unknown, expectedId: string | number): Order {
  const raw = unwrap(value);
  if (
    !raw ||
    String(raw.orderId ?? raw.id) !== String(expectedId) ||
    !Array.isArray(raw.items) ||
    raw.items.some((item: unknown) => !item || typeof item !== 'object') ||
    typeof raw.status !== 'string'
  )
    throw new Error('تعذر التحقق من تفاصيل الطلب');
  return {
    ...order(raw),
    orderTotalUSD:
      optionalPrice(raw.orderTotalUSD ?? raw.totalPrice ?? raw.totalAmount) ?? Number.NaN,
    deliveryFee: optionalPrice(raw.deliveryFee ?? raw.fee) ?? undefined,
  };
}
export function orderStatuses(value: unknown): { status: string; isTerminal: boolean }[] {
  const raw = unwrap(value);
  if (
    !Array.isArray(raw) ||
    raw.some(
      (item) =>
        typeof item?.status !== 'string' ||
        !item.status.trim() ||
        typeof item?.isTerminal !== 'boolean',
    )
  )
    throw new Error('تعذر التحقق من حالات الطلب');
  return raw.map(({ status, isTerminal }) => ({ status, isTerminal }));
}
export function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  const value = error as Raw | null;
  return value?.message ?? value?.data?.message ?? 'تعذر إتمام الطلب. حاول مرة أخرى.';
}

export function deliveryAreas(value: unknown): DeliveryArea[] {
  const body = unwrap(value);
  if (!Array.isArray(body)) throw new Error('استجابة مناطق التوصيل غير صالحة');
  return body.map((item) => ({
    deliveryAreaId: item.deliveryAreaId ?? item.id ?? item.city,
    city: item.city ?? item.name ?? item.areaName,
    fee: item.fee == null ? null : Number(item.fee),
    isInternalDelivery:
      typeof item.isInternalDelivery === 'boolean' ? item.isInternalDelivery : undefined,
    oliveryAreaId: item.oliveryAreaId ?? null,
    oliveryAreaName: typeof item.oliveryAreaName === 'string' ? item.oliveryAreaName : null,
  }));
}
