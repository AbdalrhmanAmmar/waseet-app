import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { refreshProductDetails, useProductDetailsQuery } from '@/api/shared/catalog';
import { detailsFailure, optionalPrice, suggestedPrice } from '@/domain/product-details';
import { useSession } from './use-session';
import { useAppDispatch } from './use-store';
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
  const [desired, setDesired] = useState(1);
  const stock =
    product?.stockKnown !== false && Number.isFinite(product?.stock)
      ? Math.max(0, Math.floor(product!.stock))
      : null;
  const quantity = stock == null ? desired : Math.min(desired, stock);
  const unitPrice = suggested ?? (merchant ? merchantPrice : null) ?? optionalPrice(product?.price);
  const ready = !!query.currentData && !query.error && !busy;
  const canCreate = ready && stock != null && stock > 0 && quantity > 0;
  const refresh = useCallback(async () => {
    if (!id || !userData) return;
    await dispatch(refreshProductDetails({ product_id: id, user_id: userData.userId }));
  }, [dispatch, id, userData]);
  useEffect(() => {
    onResume.current = () => {
      void refresh();
    };
    return () => {
      onResume.current = () => {};
    };
  }, [refresh]);
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
  const change = (delta: number) => setDesired(Math.max(1, Math.min(stock ?? 1, quantity + delta)));
  return {
    product,
    merchant,
    merchantPrice,
    suggested,
    unitPrice,
    stock,
    quantity,
    busy,
    ready,
    canCreate,
    notFound,
    error: query.error,
    failure: detailsFailure(query.error, false),
    active,
    change,
    refresh,
    loading: query.isLoading,
  };
}
