'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OrderListQuery, OrderListResponse } from '../domain/types';
import { fetchOrders } from '../services/ordersApi';

export function useOrderList(query: OrderListQuery) {
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serializedQuery = useMemo(
    () =>
      JSON.stringify({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword,
        status: query.status,
        createdFrom: query.createdFrom,
        createdTo: query.createdTo,
        minAmount: query.minAmount,
        maxAmount: query.maxAmount,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }),
    [
      query.page,
      query.pageSize,
      query.keyword,
      query.status,
      query.createdFrom,
      query.createdTo,
      query.minAmount,
      query.maxAmount,
      query.sortBy,
      query.sortOrder,
    ]
  );

  const currentQuery = useMemo(() => JSON.parse(serializedQuery) as OrderListQuery, [serializedQuery]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchOrders(currentQuery)
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e ?? 'Unknown error');
        setError(message);
        setData(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serializedQuery, currentQuery]);

  return { data, loading, error };
}
