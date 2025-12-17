'use client';

import { Suspense, useMemo, useState } from 'react';
import type { Order } from '@/features/orders/domain/types';
import { useOrderQuery } from '@/features/orders/hooks/useOrderQuery';
import { useOrderList } from '@/features/orders/hooks/useOrderList';
import { useOrderActions } from '@/features/orders/hooks/useOrderActions';
import { partitionIdsByAction } from '@/features/orders/domain/rules';
import { batchAction } from '@/features/orders/services/ordersApi';
import { useOrderSelection } from '@/features/orders/hooks/useOrderSelection';
import { OrderFilterBar } from '@/features/orders/components/OrderFilterBar';
import { OrderTable } from '@/features/orders/components/OrderTable';
import OrderDetailDrawer from '@/features/orders/components/OrderDetailDrawer';
import { Button, Popconfirm, Toast } from 'beaver-ui';

function OrdersPageContent() {
  const { query, setQuery, resetQuery, refresh, reloadKey } = useOrderQuery();
  const { data, loading, error } = useOrderList(query, reloadKey);
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
    const res = await onCancel(o);
    if (!res.ok) {
      Toast.error(res.message ?? '取消失败');
    } else {
      Toast.success('取消成功');
    }
    refresh();
  }

  // 删除订单处理
  async function handleDelete(o: Order) {
    const res = await onDelete(o);
    if (!res.ok) {
      Toast.error(res.message ?? '删除失败');
    } else {
      Toast.success('删除成功');
    }
    refresh();
  }

  // 批量取消
  async function handleBatchCancel() {
    if (selectedIds.length === 0) return;
    // 先在客户端按规则过滤出允许取消的 id，避免无谓请求
    const { allowedIds, skippedIds } = partitionIdsByAction(orders, selectedIds, 'cancel');

    if (allowedIds.length === 0) {
      Toast.info(`没有可取消的订单（跳过 ${skippedIds.length} 条）`);
      clear();
      return;
    }

    try {
      const res = await batchAction('cancel', allowedIds);
      const messages: string[] = [];
      if (res.successIds.length) messages.push(`成功取消 ${res.successIds.length} 条`);
      if (res.skippedIds.length || skippedIds.length)
        messages.push(`跳过 ${res.skippedIds.length + skippedIds.length} 条`);
      if (res.failed.length) messages.push(`失败 ${res.failed.length} 条`);

      if (res.successIds.length && !res.failed.length) Toast.success(messages.join('，'));
      else if (res.failed.length) Toast.error(messages.join('，'));
      else Toast.info(messages.join('，'));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e ?? 'Batch cancel failed');
      Toast.error(msg);
    } finally {
      clear();
      refresh();
    }
  }

  // 批量删除
  async function handleBatchDelete() {
    if (selectedIds.length === 0) return;
    // 先在客户端按规则过滤出允许删除的 id，避免无谓请求
    const { allowedIds, skippedIds } = partitionIdsByAction(orders, selectedIds, 'delete');

    if (allowedIds.length === 0) {
      Toast.info(`没有可删除的订单（跳过 ${skippedIds.length} 条）`);
      clear();
      return;
    }

    try {
      const res = await batchAction('delete', allowedIds);
      // 提示结果：成功 / 跳过 / 失败
      const messages: string[] = [];
      if (res.successIds.length) messages.push(`成功删除 ${res.successIds.length} 条`);
      if (res.skippedIds.length || skippedIds.length)
        messages.push(`跳过 ${res.skippedIds.length + skippedIds.length} 条`);
      if (res.failed.length) messages.push(`失败 ${res.failed.length} 条`);
      // choose type based on results
      if (res.successIds.length && !res.failed.length) Toast.success(messages.join('，'));
      else if (res.failed.length) Toast.error(messages.join('，'));
      else Toast.info(messages.join('，'));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e ?? 'Batch delete failed');
      Toast.error(msg);
    } finally {
      clear();
      refresh();
    }
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
        <div
          role="alert"
          style={{
            padding: 12,
            border: '1px solid #fca5a5',
            borderRadius: 8,
            color: '#991b1b',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>⚠️</span>
            <div style={{ fontSize: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>请求失败</div>
              <div style={{ maxWidth: 800, wordBreak: 'break-word', color: '#701a1a' }}>{String(error)}</div>
            </div>
          </div>
          <div>
            <Button size="small" onClick={() => refresh()} variant="link">
              重试
            </Button>
          </div>
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>加载中...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
