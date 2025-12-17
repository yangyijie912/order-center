'use client';

import { useCallback, useState } from 'react';
import type { Order } from '@/features/orders/domain/types';

export function useOrderSelection(initial: string[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initial));

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const setAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const selectAllOnPage = useCallback((orders: Order[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      orders.forEach((o) => next.add(o.id));
      return next;
    });
  }, []);

  const unselectAllOnPage = useCallback((orders: Order[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      orders.forEach((o) => next.delete(o.id));
      return next;
    });
  }, []);

  const selectedIdsList = Array.from(selectedIds.values());

  return {
    selectedIds: selectedIdsList,
    selectedSet: selectedIds,
    isSelected,
    toggle,
    clear,
    setAll,
    selectAllOnPage,
    unselectAllOnPage,
  } as const;
}
