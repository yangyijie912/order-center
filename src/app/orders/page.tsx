'use client';

import { useMemo, useState } from 'react';
import type { Order } from '@/features/orders/domain/types';
import { useOrderQuery } from '@/features/orders/hooks/useOrderQuery';
import { useOrderList } from '@/features/orders/hooks/useOrderList';
import { useOrderActions } from '@/features/orders/hooks/useOrderActions';
import { useOrderSelection } from '@/features/orders/hooks/useOrderSelection';
import { OrderFilterBar } from '@/features/orders/components/OrderFilterBar';
import { OrderTable } from '@/features/orders/components/OrderTable';
import OrderDetailDrawer from '@/features/orders/components/OrderDetailDrawer';
import { Button, Popconfirm } from 'beaver-ui';

export default function OrdersPage() {
  const { query, setQuery, resetQuery } = useOrderQuery();
  const { data, loading, error } = useOrderList(query);
  const { onCancel, onDelete } = useOrderActions();
  const { selectedIds, clear, toggle } = useOrderSelection();

  // 详情抽屉状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  // 查看详情
  function handleViewDetail(o: Order) {
    setDetailOrder(o);
    setDetailOpen(true);
  }

  // 关闭详情
  function handleCloseDetail() {
    setDetailOpen(false);
    setTimeout(() => setDetailOrder(null), 300);
  }

  // 取消订单处理
  async function handleCancel(o: Order) {
    const res = await onCancel(o.id);
    if (!res.ok) alert(res.message);
    setQuery({ page: query.page }, { replace: true });
  }

  // 删除订单处理
  async function handleDelete(o: Order) {
    const res = await onDelete(o.id);
    if (!res.ok) alert(res.message);
    setQuery({ page: query.page }, { replace: true });
  }

  // 批量取消
  async function handleBatchCancel() {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await onCancel(id);
    }
    clear();
    setQuery({ page: query.page }, { replace: true });
  }

  // 批量删除
  async function handleBatchDelete() {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await onDelete(id);
    }
    clear();
    setQuery({ page: query.page }, { replace: true });
  }

  const orders = data?.list ?? [];

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* 顶部标题 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px 0' }}>Order Center</h1>
        <p style={{ fontSize: 14, color: '#666', margin: 0 }}>订单中心 · 支持筛选、批量操作、状态流转</p>
      </div>

      {/* 筛选栏 */}
      <OrderFilterBar query={query} onChange={(patch) => setQuery(patch)} onReset={resetQuery} />

      <div style={{ height: 16 }} />

      {/* 错误提示 */}
      {error ? (
        <div style={{ padding: 12, border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 16 }}>
          ⚠️ 请求失败：{error}
        </div>
      ) : null}

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div
          style={{
            padding: 12,
            background: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 14, color: '#1e40af' }}>已选择 {selectedIds.length} 条订单</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Popconfirm
              title="批量取消"
              description={`确认批量取消 ${selectedIds.length} 个订单？`}
              okText="确定"
              cancelText="取消"
              onConfirm={handleBatchCancel}
            >
              <Button size="small" variant="link">
                批量取消
              </Button>
            </Popconfirm>
            <Popconfirm
              title="批量删除"
              description={`确认批量删除 ${selectedIds.length} 个订单？此操作不可恢复`}
              okText="删除"
              okVariant="ghost"
              cancelText="取消"
              onConfirm={handleBatchDelete}
            >
              <Button size="small" color="danger" variant="link">
                批量删除
              </Button>
            </Popconfirm>
            <Button size="small" onClick={clear} variant="link">
              清空选择
            </Button>
          </div>
        </div>
      )}

      {/* 表格 */}
      <OrderTable
        orders={orders}
        loading={loading}
        selectedKeys={selectedIds}
        onSelectionChange={(keys) => {
          clear();
          keys.forEach((k) => toggle(k));
        }}
        onView={handleViewDetail}
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

      {/* 分页信息 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          fontSize: 13,
          color: '#666',
        }}
      >
        <span>
          共 {data?.total ?? 0} 条，当前 {data?.page ?? 1} / {totalPages}
        </span>
        <div />
      </div>

      {/* 详情抽屉 */}
      <OrderDetailDrawer open={detailOpen} order={detailOrder} onClose={handleCloseDetail} />
    </div>
  );
}
