'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OrderListQuery, OrderListResponse } from '../domain/types';
import { fetchOrders } from '../services/ordersApi';

/**
 * useOrderList
 * - 根据传入的 query 调用后端获取订单列表
 * - 返回 { data, loading, error }
 *
 * 注意点：为了避免 useEffect 对象引用导致的重复请求，先将 query 的关键字段序列化为字符串，
 * 再解析为 `currentQuery` 作为实际请求参数。这可以兼顾稳定的依赖与可比性。
 */
export function useOrderList(query: OrderListQuery) {
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 将 query 中影响请求的字段序列化，作为 useEffect 的依赖，避免对象引用导致的重复执行
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
    // 使用 cancelled 标志以避免组件卸载后仍更新状态（防止内存泄漏或 React 警告）
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
