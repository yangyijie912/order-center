import type { OrderListQuery, OrderListResponse, OrderStatus } from '../domain/types';

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

/**
 * 批量操作接口：{ action: 'cancel'|'delete', ids: string[] }
 */
export async function batchAction(
  action: 'cancel' | 'delete',
  ids: string[]
): Promise<{
  successIds: string[];
  skippedIds: string[];
  failed: { id: string; reason: string }[];
}> {
  const res = await fetch('/api/orders/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ids }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Batch ${action} failed: ${res.status}`);
  }

  return (await res.json()) as {
    successIds: string[];
    skippedIds: string[];
    failed: { id: string; reason: string }[];
  };
}

/**
 * 支付订单（模拟）
 * @param id - 订单 ID
 */
export async function payOrder(
  id: string
): Promise<{ next: Extract<OrderStatus, 'paid' | 'paying' | 'payment_failed'>; message?: string }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/pay`, { method: 'POST' });
  const body: unknown = await res.json().catch(() => ({}));

  const message =
    body && typeof body === 'object' && 'message' in (body as Record<string, unknown>)
      ? String((body as Record<string, unknown>).message)
      : undefined;

  if (res.status === 200) return { next: 'paid', message };
  if (res.status === 202) return { next: 'paying', message };
  if (res.status === 402) return { next: 'payment_failed', message };

  throw new Error(message ?? `Pay failed: ${res.status}`);
}

/**
 * 退款订单（模拟）
 */
export async function refundOrder(id: string): Promise<{ success: true }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/refund`, { method: 'POST' });
  if (!res.ok) throw new Error(`Refund failed: ${res.status}`);
  return (await res.json()) as { success: true };
}

/**
 * 发货（模拟）
 * @param id - 订单 ID
 * @param trackingNo - 可选的运单号
 */
export async function shipOrder(id: string, trackingNo?: string): Promise<{ success: true }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/ship`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackingNo }),
  });
  if (!res.ok) throw new Error(`Ship failed: ${res.status}`);
  return (await res.json()) as { success: true };
}
