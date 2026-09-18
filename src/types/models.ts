import type { Role } from '@/auth/roles';
import type { AccountReview } from '@/auth/account-review';
export type Id = string | number;
export interface User {
  userId: Id;
  id?: Id;
  user_id?: Id;
  role: Role;
  token: string;
  firstName?: string;
  secondName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  address?: string;
  accountStatus?: string;
  status?: string;
  priceListId?: Id;
  [key: string]: unknown;
}
export interface Product {
  id: Id;
  productCode: Id;
  name: string;
  title: string;
  price: number;
  image?: string;
  imageUrl?: string;
  category: string;
  stock: number;
  merchantSellPrice?: number;
  effectiveExpectedSellPrice?: number;
  expectedSellPrice?: number | null;
  videoUrl?: string;
  updatedAt?: string;
  categoryProvided?: boolean;
  stockKnown?: boolean;
  description?: string;
  [key: string]: unknown;
}
export interface CartItem extends Product {
  cart_id: string;
  quantity: number;
  sellingPrice: number;
}
export interface Order {
  orderId: Id;
  customerName: string;
  status: string;
  createdAt?: string;
  customerMobile?: string;
  customerArea?: string;
  customerAddress?: string;
  orderTotalUSD: number;
  deliveryFee?: number;
  totalMerchantProfitUSD?: number;
  items: Record<string, unknown>[];
  [key: string]: unknown;
}
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}
export interface PageParams {
  page?: number;
  pageSize?: number;
}
export interface ApiError {
  status: number | string;
  message: string;
  accountReview?: AccountReview;
}
export interface DeliveryArea {
  deliveryAreaId: Id;
  city: string;
  fee: number | null;
}
export interface OrderInput {
  customerName: string;
  customerMobile: string;
  customerArea: string;
  customerAddress: string;
  items: { productCode: number; quantity: number; actualSellPriceUSD: number; color?: string }[];
}
export interface StatusInput {
  orderId: Id;
  status: string;
  notes?: string;
}
