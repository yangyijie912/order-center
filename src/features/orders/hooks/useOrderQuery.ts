'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { OrderListQuery, OrderStatus } from '../domain/types';

// 默认分页大小
const DEFAULT_PAGE_SIZE = 10;

// 将可能为 null 的字符串解析为受限范围内的整数
function clampInt(v: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(v ?? '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * useOrderQuery
 * - 将 URL 查询参数解析为 `OrderListQuery`，并提供更新查询参数的 `setQuery` / `resetQuery`
 * - 使用 URL Search Params 作为单一数据源，方便分享/书签以及后退前进行为一致性
 */
export function useOrderQuery() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  // 从 URLSearchParams 解析出强类型的查询对象
  const query: OrderListQuery = useMemo(() => {
    const page = clampInt(sp.get('page'), 1, 1, 9999);
    const pageSize = clampInt(sp.get('pageSize'), DEFAULT_PAGE_SIZE, 5, 100);

    const statusRaw = sp.get('status') ?? 'all';
    const status = statusRaw === 'all' ? 'all' : (statusRaw as OrderStatus);

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

  /**
   * 更新查询参数
   * - 接收部分补丁对象，将其合并到当前 query
   * - 若涉及筛选条件变更（非 page），会将页码重置为 1（除非在 patch 中显式设置 page）
   * - 支持通过 opts.replace 决定使用 router.replace（替换历史）还是 router.push（新增历史）
   */
  function setQuery(patch: Partial<OrderListQuery>, opts?: { replace?: boolean }) {
    const next = { ...query, ...patch };

    // 任意筛选变化，重置 page=1
    const filterKeys: (keyof OrderListQuery)[] = [
      'keyword',
      'status',
      'createdFrom',
      'createdTo',
      'minAmount',
      'maxAmount',
      'sortBy',
      'sortOrder',
      'pageSize',
    ];
    const patchRecord = patch as Partial<Record<keyof OrderListQuery, unknown>>;
    const filtersChanged = filterKeys.some((k) => patchRecord[k] !== undefined);
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

  // 强制刷新列表（不改变过滤条件），通过增加一个简单的数字键触发依赖更新
  function refresh() {
    // 使用 router.replace 带上一个时间戳参数，保证 URL 本身不发生可见变化
    // 但更重要的是通过 setReloadKey 通知使用该键的 hook 重新拉取
    setReloadKey((k: number) => (k ?? 0) + 1);
  }

  // 将查询重置为默认第一页、默认分页及排序
  function resetQuery() {
    router.push(`${pathname}?page=1&pageSize=${DEFAULT_PAGE_SIZE}&sortBy=createdAt&sortOrder=desc`);
  }

  return { query, setQuery, resetQuery, refresh, reloadKey };
}
