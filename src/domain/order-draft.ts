import type { DeliveryArea, OrderInput, Product } from '@/types/models';
import { normalizeNumber } from '@/components/shared/catalog/catalog-model';
import { optionalPrice, suggestedPrice } from './product-details';

export interface DraftItem {
  key: string;
  product: Product;
  quantity: string;
  price: string;
  color: string;
}
export interface OrderDraft {
  customerName: string;
  customerMobile: string;
  customerArea: string;
  customerAddress: string;
  items: DraftItem[];
}
export type DraftErrors = Record<string, string>;
export const emptyOrder = (): OrderDraft => ({
  customerName: '',
  customerMobile: '',
  customerArea: '',
  customerAddress: '',
  items: [],
});
export const draftItem = (product: Product, quantity = 1): DraftItem => ({
  key: String(product.productCode),
  product,
  quantity: String(quantity),
  price: String(suggestedPrice(product) ?? optionalPrice(product.merchantSellPrice) ?? ''),
  color: '',
});
export const lineTotal = (row: DraftItem) => {
  const n = Number(normalizeNumber(row.quantity)),
    price = Number(normalizeNumber(row.price));
  return Number.isFinite(n * price) && n > 0 && price > 0 ? Math.round(n * price * 100) / 100 : 0;
};
export const orderSubtotal = (draft: OrderDraft) =>
  Math.round(draft.items.reduce((sum, row) => sum + lineTotal(row), 0) * 100) / 100;
export function validateOrder(draft: OrderDraft, areas: DeliveryArea[]): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.customerName.trim().length < 2)
    errors.customerName = 'اسم العميل يجب أن يكون حرفين على الأقل';
  if (!/^09\d{8}$/.test(normalizeNumber(draft.customerMobile)))
    errors.customerMobile = 'أدخل رقمًا سوريًا يبدأ بـ 09 ويتكون من 10 أرقام';
  if (!areas.some((area) => area.city === draft.customerArea))
    errors.customerArea = 'اختر منطقة توصيل متاحة';
  else if (
    !areas.some(
      (area) =>
        area.city === draft.customerArea &&
        area.fee != null &&
        Number.isFinite(area.fee) &&
        area.fee >= 0,
    )
  )
    errors.customerArea = 'رسوم هذه المنطقة غير متاحة حاليًا';
  if (draft.customerAddress.trim().length < 4)
    errors.customerAddress = 'أدخل عنوانًا تفصيليًا من أربعة أحرف على الأقل';
  if (!draft.items.length) errors.items = 'أضف منتجًا واحدًا على الأقل';
  const seen = new Set<string>();
  draft.items.forEach((row) => {
    const code = Number(row.product.productCode),
      qty = Number(normalizeNumber(row.quantity)),
      price = Number(normalizeNumber(row.price));
    const prefix = `items.${row.key}`;
    if (!Number.isInteger(code) || code <= 0) errors[`${prefix}.product`] = 'معرّف المنتج غير صالح';
    if (seen.has(String(code))) errors[`${prefix}.product`] = 'المنتج موجود بالفعل في الطلب';
    seen.add(String(code));
    if (!Number.isInteger(qty) || qty < 1)
      errors[`${prefix}.quantity`] = 'أدخل كمية صحيحة أكبر من صفر';
    else if (
      row.product.stockKnown === false ||
      !Number.isFinite(row.product.stock) ||
      qty > row.product.stock
    )
      errors[`${prefix}.quantity`] = 'الكمية المطلوبة غير متاحة في المخزون';
    if (!Number.isFinite(price) || price <= 0)
      errors[`${prefix}.price`] = 'سعر البيع يجب أن يكون أكبر من صفر';
    else if (Math.abs(price * 100 - Math.round(price * 100)) > 0.000001)
      errors[`${prefix}.price`] = 'استخدم منزلتين عشريتين كحد أقصى';
    if (!row.color.trim()) errors[`${prefix}.color`] = 'لون المنتج مطلوب';
    else if (row.color.trim().length > 50) errors[`${prefix}.color`] = 'اللون لا يتجاوز 50 حرفًا';
  });
  return errors;
}
export const orderPayload = (draft: OrderDraft): OrderInput => ({
  customerName: draft.customerName.trim(),
  customerMobile: normalizeNumber(draft.customerMobile),
  customerArea: draft.customerArea,
  customerAddress: draft.customerAddress.trim(),
  items: draft.items.map((row) => ({
    productCode: Number(row.product.productCode),
    quantity: Number(normalizeNumber(row.quantity)),
    actualSellPriceUSD: Number(normalizeNumber(row.price)),
    color: row.color.trim(),
  })),
});
