'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { OrderListQuery, OrderStatus } from '../domain/types';

const DEFAULT_PAGE_SIZE = 10;

function clampInt(v: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(v ?? '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function useOrderQuery() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const query: OrderListQuery = useMemo(() => {
    const page = clampInt(sp.get('page'), 1, 1, 9999);
    const pageSize = clampInt(sp.get('pageSize'), DEFAULT_PAGE_SIZE, 5, 100);

    const statusRaw = sp.get('status') ?? 'all';
    const status = (statusRaw === 'all' ? 'all' : (statusRaw as OrderStatus));

    const keyword = sp.get('keyword') ?? undefined;
    const createdFrom = sp.get('createdFrom') ?? undefined;
    const createdTo = sp.get('createdTo') ?? undefined;

    const minAmountStr = sp.get('minAmount');
    const maxAmountStr = sp.get('maxAmount');
    const minAmount = minAmountStr == null ? undefined : Number(minAmountStr);
    const maxAmount = maxAmountStr == null ? undefined : Number(maxAmountStr);

    const sortBy = (sp.get('sortBy') as 'createdAt' | 'amount' | null) ?? 'createdAt';
    const sortOrder = (sp.get('sortOrder') as 'asc' | 'desc' | null) ?? 'desc';

    return {
      page,
      pageSize,
      keyword,
      status,
      createdFrom,
      createdTo,
      minAmount: Number.isFinite(minAmount) ? minAmount : undefined,
      maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined,
      sortBy,
      sortOrder,
    };
  }, [sp]);

  function setQuery(patch: Partial<OrderListQuery>, opts?: { replace?: boolean }) {
    const next = { ...query, ...patch };

    // 任意筛选变化，重置 page=1
    const filterKeys: (keyof OrderListQuery)[] = [
      'keyword', 'status', 'createdFrom', 'createdTo', 'minAmount', 'maxAmount', 'sortBy', 'sortOrder', 'pageSize'
    ];
    const filtersChanged = filterKeys.some(k => (patch as any)[k] !== undefined);
    if (filtersChanged && patch.page === undefined) next.page = 1;

    const nsp = new URLSearchParams();
    nsp.set('page', String(next.page));
    nsp.set('pageSize', String(next.pageSize));

    if (next.keyword) nsp.set('keyword', next.keyword);
    if (next.status && next.status !== 'all') nsp.set('status', next.status);
    if (next.createdFrom) nsp.set('createdFrom', next.createdFrom);
    if (next.createdTo) nsp.set('createdTo', next.createdTo);
    if (next.minAmount != null) nsp.set('minAmount', String(next.minAmount));
    if (next.maxAmount != null) nsp.set('maxAmount', String(next.maxAmount));
    if (next.sortBy) nsp.set('sortBy', next.sortBy);
    if (next.sortOrder) nsp.set('sortOrder', next.sortOrder);

    const url = `${pathname}?${nsp.toString()}`;
    (opts?.replace ? router.replace : router.push)(url);
  }

  function resetQuery() {
    router.push(`${pathname}?page=1&pageSize=${DEFAULT_PAGE_SIZE}&sortBy=createdAt&sortOrder=desc`);
  }

  return { query, setQuery, resetQuery };
}
