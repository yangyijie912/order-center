import type { OrderListQuery, OrderListResponse } from '../domain/types';

export async function fetchOrders(query: OrderListQuery, init?: RequestInit): Promise<OrderListResponse> {
  const sp = new URLSearchParams();
  sp.set('page', String(query.page));
  sp.set('pageSize', String(query.pageSize));
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
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Failed to fetch orders: ${res.status}`);
  }

  return (await res.json()) as OrderListResponse;
}

export async function cancelOrder(id: string): Promise<{ success: true }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error(`Cancel failed: ${res.status}`);
  return (await res.json()) as { success: true };
}

export async function deleteOrder(id: string): Promise<{ success: true }> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/delete`, { method: 'POST' });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return (await res.json()) as { success: true };
}
