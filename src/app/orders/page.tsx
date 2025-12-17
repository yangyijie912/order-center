'use client';

import { useMemo, useState } from 'react';
import type { Order } from '@/features/orders/domain/types';
import { useOrderQuery } from '@/features/orders/hooks/useOrderQuery';
import { useOrderList } from '@/features/orders/hooks/useOrderList';
import { useOrderActions } from '@/features/orders/hooks/useOrderActions';
import { OrderFilterBar } from '@/features/orders/components/OrderFilterBar';
import { OrderTable } from '@/features/orders/components/OrderTable';
import { Button } from 'beaver-ui';

// OrdersPage：订单管理页面
// - 组合 useOrderQuery/useOrderList/useOrderActions 等 hooks
// - 渲染筛选栏、表格与分页、以及单条订单详情面板
export default function OrdersPage() {
  const { query, setQuery, resetQuery } = useOrderQuery();
  const { data, loading, error } = useOrderList(query);
  const { onCancel, onDelete } = useOrderActions();

  // 当前选中的订单详情
  const [detail, setDetail] = useState<Order | null>(null);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  // 取消订单处理：确认 -> 调用 hook -> 若失败显示错误 -> 刷新当前页
  async function handleCancel(o: Order) {
    const ok = confirm(`确认取消订单：${o.id} ?`);
    if (!ok) return;
    const res = await onCancel(o.id);
    if (!res.ok) alert(res.message);
    // 使用 replace=true 避免增加历史记录，仅刷新当前页面数据
    setQuery({ page: query.page }, { replace: true }); // 触发刷新
  }

  // 删除订单处理：确认 -> 调用 hook -> 刷新
  async function handleDelete(o: Order) {
    const ok = confirm(`确认删除订单：${o.id} ?`);
    if (!ok) return;
    const res = await onDelete(o.id);
    if (!res.ok) alert(res.message);
    setQuery({ page: query.page }, { replace: true });
  }

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Order Center（订单中心）</h1>

      <OrderFilterBar query={query} onChange={(patch) => setQuery(patch)} onReset={resetQuery} />

      <div style={{ height: 12 }} />

      {error ? (
        <div style={{ padding: 12, border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b' }}>
          请求失败：{error}
        </div>
      ) : null}

      <div style={{ height: 12 }} />

      <OrderTable
        orders={data?.list ?? []}
        loading={loading}
        onView={(o) => setDetail(o)}
        onCancel={handleCancel}
        onDelete={handleDelete}
        pagination={
          data
            ? {
                total: data.total,
                page: data.page,
                pageSize: data.pageSize,
                onChange: (p, ps) => setQuery({ page: p, pageSize: ps ?? data.pageSize }),
              }
            : false
        }
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div style={{ fontSize: 13, color: '#555' }}>
          共 {data?.total ?? 0} 条，page {data?.page ?? query.page} / {totalPages}
        </div>
        <div />
      </div>

      {detail ? (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>订单详情</strong>
            <Button onClick={() => setDetail(null)} size="small">
              关闭
            </Button>
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(detail, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
