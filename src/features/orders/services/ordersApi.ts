import type { OrderListQuery, OrderListResponse } from '../domain/types';

/**
 * 将 `OrderListQuery` 转换为查询字符串并调用后端 `/api/orders` 获取列表
 * @param query - 过滤/分页/排序参数
 * @param init - 可选的 fetch init，用于在需要时覆盖请求头或其他选项
 */
export async function fetchOrders(query: OrderListQuery, init?: RequestInit): Promise<OrderListResponse> {
  const sp = new URLSearchParams();
  // 必填分页参数
  sp.set('page', String(query.page));
  sp.set('pageSize', String(query.pageSize));
  // 可选筛选项，只在存在时加入查询字符串
  if (query.keyword) sp.set('keyword', query.keyword);
  if (query.status && query.status !== 'all') sp.set('status', query.status);
  if (query.createdFrom) sp.set('createdFrom', query.createdFrom);
  if (query.createdTo) sp.set('createdTo', query.createdTo);
  if (query.minAmount != null) sp.set('minAmount', String(query.minAmount));
  if (query.maxAmount != null) sp.set('maxAmount', String(query.maxAmount));
  if (query.sortBy) sp.set('sortBy', query.sortBy);
  if (query.sortOrder) sp.set('sortOrder', query.sortOrder);

  const res = await fetch(`/api/orders?${sp.toString()}`, {
    method: 'GET',
    ...init,
    // 默认以 JSON 交互；允许外部通过 `init.headers` 覆盖
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    // 不缓存，确保每次请求都是最新数据
    cache: 'no-store',
  });

  // 基本的错误处理：若返回非 2xx，则读取文本作为错误消息
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Failed to fetch orders: ${res.status}`);
  }

  return (await res.json()) as OrderListResponse;
}

/**
 * 取消订单（POST 请求）
 * @param id - 订单 ID
 */
export async function cancelOrder(id: string): Promise<{ success: true }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error(`Cancel failed: ${res.status}`);
  return (await res.json()) as { success: true };
}

/**
 * 删除订单（POST 请求）
 * @param id - 订单 ID
 */
export async function deleteOrder(id: string): Promise<{ success: true }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/delete`, { method: 'POST' });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return (await res.json()) as { success: true };
}
