import type { Product } from '@/types/models';
export type CatalogView = 'grid' | 'list';
export type Sort = 'default' | 'price_asc' | 'price_desc' | 'title_az';
export interface Filters {
  category: string;
  available: boolean;
  min: string;
  max: string;
  sort: Sort;
}
export const defaultFilters: Filters = {
  category: '',
  available: false,
  min: '',
  max: '',
  sort: 'default',
};
export const sortOptions: { id: Sort; label: string }[] = [
  { id: 'default', label: 'الافتراضي' },
  { id: 'price_asc', label: 'الأقل سعرًا' },
  { id: 'price_desc', label: 'الأعلى سعرًا' },
  { id: 'title_az', label: 'الاسم' },
];
export const salePrice = (item: Product) => Number(item.effectiveExpectedSellPrice ?? item.price);
export const normalizeSearch = (text: string) =>
  text
    .trim()
    .toLocaleLowerCase('ar')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي');
export const normalizeNumber = (text: string) =>
  text
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace('٫', '.')
    .trim();
export function priceRangeError(filters: Filters) {
  for (const value of [filters.min, filters.max])
    if (value && (!Number.isFinite(Number(value)) || Number(value) < 0))
      return 'أدخل سعرًا صحيحًا لا يقل عن صفر.';
  if (filters.min && filters.max && Number(filters.min) > Number(filters.max))
    return 'السعر الأدنى يجب ألا يتجاوز السعر الأعلى.';
  return '';
}
export function filterProducts(products: Product[], search: string, filters: Filters) {
  const q = normalizeSearch(search);
  const list = products.filter(
    (item) =>
      (!filters.category || item.category === filters.category) &&
      (!filters.available || item.stock > 0) &&
      (!filters.min || salePrice(item) >= Number(filters.min)) &&
      (!filters.max || salePrice(item) <= Number(filters.max)) &&
      (!q || normalizeSearch(`${item.title} ${item.productCode}`).includes(q)),
  );
  if (filters.sort === 'price_asc') list.sort((a, b) => salePrice(a) - salePrice(b));
  if (filters.sort === 'price_desc') list.sort((a, b) => salePrice(b) - salePrice(a));
  if (filters.sort === 'title_az') list.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
  return list;
}
