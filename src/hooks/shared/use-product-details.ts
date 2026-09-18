import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { refreshProductDetails, useProductDetailsQuery } from '@/api/shared/catalog';
import { detailsFailure, optionalPrice, suggestedPrice } from '@/domain/product-details';
import { useSession } from './use-session';
import { useAppDispatch, useAppSelector } from './use-store';
import { setCartProductLocal } from '@/store/slices/cart';
import type { Product } from '@/types/models';
export function useProductDetails(id: string, initial?: Product) {
  const { userData, role } = useSession();
  const dispatch = useAppDispatch();
  const [active, setActive] = useState(true);
  const resumed = useRef(false);
  const onResume = useRef(() => {});
  const query = useProductDetailsQuery(
    { product_id: id, user_id: userData?.userId ?? '' },
    { skip: !id || !userData, refetchOnMountOrArgChange: true },
  );
  const merchant = role === 'Merchant';
  const notFound = !!query.error && 'status' in query.error && query.error.status === 404;
  const product = notFound ? undefined : (query.currentData ?? initial);
  const busy = query.isFetching;
  // Prices come from Product/{id}, together with the latest stock and description.
  const merchantPrice =
    !merchant || query.error || busy ? null : optionalPrice(query.currentData?.merchantSellPrice);
  const suggested = product ? suggestedPrice(product) : null;
  const cart = useAppSelector((state) =>
    state.cart.userCart.data.find((item) => String(item.productCode) === id),
  );
  const cartCount = useAppSelector((state) =>
    state.cart.userCart.data.reduce((n, item) => n + item.quantity, 0),
  );
  const [desired, setDesired] = useState(cart?.quantity ?? 1);
  const [notice, setNotice] = useState('');
  const stock =
    product?.stockKnown !== false && Number.isFinite(product?.stock)
      ? Math.max(0, Math.floor(product!.stock))
      : null;
  const quantity = stock == null ? desired : Math.min(desired, stock);
  // Preserve a price explicitly edited in the cart. New lines retain the application's selling-price semantics.
  const unitPrice =
    optionalPrice(cart?.sellingPrice) ??
    suggested ??
    (merchant ? merchantPrice : null) ??
    optionalPrice(product?.price);
  const ready = !!query.currentData && !query.error && !busy;
  const changed =
    !!cart &&
    !!product &&
    (cart.quantity !== quantity ||
      cart.stock !== stock ||
      cart.merchantSellPrice !== (merchantPrice ?? undefined));
  const viewCart = !!cart && (!changed || stock === 0);
  const canSave =
    ready && stock != null && stock > 0 && unitPrice != null && (quantity > 0 || !!cart);
  const refresh = useCallback(async () => {
    if (!id || !userData) return;
    await dispatch(refreshProductDetails({ product_id: id, user_id: userData.userId }));
  }, [dispatch, id, userData]);
  useEffect(() => {
    onResume.current = () => {
      setDesired(cart?.quantity ?? 1);
      setNotice('');
      void refresh();
    };
    return () => {
      onResume.current = () => {};
    };
  }, [cart?.quantity, refresh]);
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      if (resumed.current) onResume.current();
      resumed.current = true;
      return () => setActive(false);
    }, []),
  );
  useEffect(() => {
    if (!active) return;
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => listener.remove();
  }, [active, refresh]);
  const change = (delta: number) => {
    setNotice('');
    setDesired(Math.max(cart ? 0 : 1, Math.min(stock ?? 1, quantity + delta)));
  };
  const save = () => {
    if (!product || !canSave || unitPrice == null) return;
    dispatch(
      setCartProductLocal({
        product: { ...product, merchantSellPrice: merchantPrice ?? undefined },
        quantity,
        sellingPrice: unitPrice,
      }),
    );
    setNotice(
      quantity === 0
        ? 'تم حذف المنتج من السلة'
        : cart
          ? 'تم تحديث الكمية في السلة'
          : `تمت إضافة ${quantity} قطعة إلى السلة`,
    );
    if (quantity === 0) setDesired(1);
  };
  return {
    product,
    merchant,
    merchantPrice,
    suggested,
    unitPrice,
    stock,
    quantity,
    cart,
    cartCount,
    notice,
    busy,
    ready,
    canSave,
    viewCart,
    notFound,
    error: query.error,
    failure: detailsFailure(query.error, false),
    active,
    change,
    save,
    refresh,
    loading: query.isLoading,
  };
}
