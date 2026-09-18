import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CatalogView } from '@/components/shared/catalog/catalog-model';
const key = 'waseet.catalog.view';
export function useCatalogView() {
  const [view, setView] = useState<CatalogView>('grid');
  const changed = useRef(false);
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(key)
      .then((saved) => {
        if (mounted && !changed.current && (saved === 'grid' || saved === 'list')) setView(saved);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  const select = (value: CatalogView) => {
    changed.current = true;
    setView(value);
    void AsyncStorage.setItem(key, value).catch(() => {});
  };
  return [view, select] as const;
}
