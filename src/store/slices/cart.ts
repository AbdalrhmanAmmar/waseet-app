import { product } from '@/api/normalizers';
import type { CartItem, Product } from '@/types/models';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
const initialState = { userCart: { data: [] as CartItem[], totalPrice: 0 } };
function total(items: CartItem[]) {
  return (
    Math.round(items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0) * 100) / 100
  );
}
const slice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartProductLocal(
      state,
      { payload }: PayloadAction<{ product: Product; quantity: number; sellingPrice: number }>,
    ) {
      const { quantity, sellingPrice } = payload;
      const item = payload.product;
      if (item.productCode == null || !Number.isInteger(quantity) || quantity < 0) return;
      const index = state.userCart.data.findIndex(
        (row) => String(row.productCode) === String(item.productCode),
      );
      if (quantity === 0) {
        if (index >= 0) state.userCart.data.splice(index, 1);
      } else {
        if (
          !Number.isFinite(item.stock) ||
          quantity > item.stock ||
          !Number.isFinite(sellingPrice) ||
          sellingPrice < 0
        )
          return;
        const row = { ...item, cart_id: String(item.productCode), quantity, sellingPrice };
        if (index >= 0) state.userCart.data[index] = row;
        else state.userCart.data.push(row);
      }
      state.userCart.totalPrice = total(state.userCart.data);
    },
    addToCartLocal(state, { payload }: PayloadAction<Record<string, any>>) {
      const item = product(payload);
      if (item.id == null || !Number.isFinite(item.stock) || item.stock <= 0) return;
      const quantity = Math.max(1, Math.floor(Number(payload.quantityToAdd ?? 1)));
      if (!Number.isFinite(quantity) || !Number.isFinite(item.price) || item.price < 0) return;
      const existing = state.userCart.data.find(
        (row) => String(row.productCode) === String(item.productCode),
      );
      if (existing) existing.quantity = Math.min(existing.quantity + quantity, item.stock);
      else
        state.userCart.data.push({
          ...item,
          cart_id: String(item.productCode),
          quantity: Math.min(quantity, item.stock),
          sellingPrice: item.price,
        });
      state.userCart.totalPrice = total(state.userCart.data);
    },
    updateCartQuantityLocal(
      state,
      { payload }: PayloadAction<{ cart_id: string; quantity: number }>,
    ) {
      const item = state.userCart.data.find((row) => row.cart_id === String(payload.cart_id));
      if (item && Number.isFinite(payload.quantity))
        item.quantity = Math.min(item.stock, Math.max(1, Math.floor(payload.quantity)));
      state.userCart.totalPrice = total(state.userCart.data);
    },
    updateCartItemPriceLocal(
      state,
      { payload }: PayloadAction<{ cart_id: string; sellingPrice: number | string }>,
    ) {
      const item = state.userCart.data.find((row) => row.cart_id === String(payload.cart_id));
      const price = Number(payload.sellingPrice);
      if (item && Number.isFinite(price) && price >= 0) item.sellingPrice = price;
      state.userCart.totalPrice = total(state.userCart.data);
    },
    removeFromCartLocal(state, { payload }: PayloadAction<string>) {
      state.userCart.data = state.userCart.data.filter((row) => row.cart_id !== String(payload));
      state.userCart.totalPrice = total(state.userCart.data);
    },
    clearCartLocal: () => initialState,
  },
});
export const {
  setCartProductLocal,
  addToCartLocal,
  updateCartQuantityLocal,
  updateCartItemPriceLocal,
  removeFromCartLocal,
  clearCartLocal,
} = slice.actions;
export default slice.reducer;
