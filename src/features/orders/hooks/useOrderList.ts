'use client';

import { useEffect, useState } from 'react';
import type { OrderListQuery, OrderListResponse } from '../domain/types';
import { fetchOrders } from '../services/ordersApi';

export function useOrderList(query: OrderListQuery) {
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOrders(query)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message || 'Unknown error');
        setData(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [JSON.stringify(query)]);

  return { data, loading, error };
}
