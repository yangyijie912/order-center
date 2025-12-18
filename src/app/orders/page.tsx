'use client';

import { Suspense, useMemo, useState, type ChangeEvent } from 'react';
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
import { Button, Popconfirm, Toast, Modal, Input } from 'beaver-ui';

function OrdersPageContent() {
  const { query, setQuery, resetQuery, refresh, reloadKey } = useOrderQuery();
  const { data, loading, error } = useOrderList(query, reloadKey);
  const { performAction } = useOrderActions();
  const { selectedIds, clear, toggle } = useOrderSelection();

  // 详情抽屉状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  // 支付/退款 Modal 状态
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'PAY' | 'REFUND' | 'SHIP' | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [shippingNo, setShippingNo] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

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
        onAction={async (action, o) => {
          if (action === 'VIEW_DETAIL') return handleViewDetail(o);
          if (action === 'PAY' || action === 'REFUND' || action === 'SHIP') {
            setActiveOrder(o);
            setActionType(action as 'PAY' | 'REFUND' | 'SHIP');
            setRefundReason('');
            setShippingNo('');
            setActionModalOpen(true);
            return;
          }
          const res = await performAction(action, o);
          if (!res.ok) {
            Toast.error(res.message ?? '操作失败');
          } else {
            if (action === 'DELETE') Toast.success('删除成功');
            if (action === 'CANCEL') Toast.success('取消成功');
          }
          refresh();
        }}
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
      {/* 支付/退款 Modal */}
      <Modal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={actionType === 'PAY' ? '支付订单' : actionType === 'REFUND' ? '退款订单' : '发货订单'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setActionModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              loading={actionLoading}
              disabled={
                actionLoading ||
                (actionType === 'PAY'
                  ? activeOrder?.status !== 'pending'
                  : actionType === 'REFUND'
                  ? activeOrder?.status !== 'paid'
                  : activeOrder?.status !== 'paid')
              }
              onClick={async () => {
                if (!activeOrder || !actionType) return;
                setActionLoading(true);
                try {
                  if (actionType === 'PAY') {
                    const res = await performAction('PAY', activeOrder);
                    if (res.ok) {
                      Toast.success('支付成功');
                      setActionModalOpen(false);
                      refresh();
                    } else if (res.status === 'paying') {
                      Toast.info(res.message ?? '支付处理中，请稍后刷新');
                      // 不关闭弹窗，允许用户等待或手动刷新
                    } else {
                      // 支付失败：展示错误并保留弹窗以便重试
                      Toast.error(res.message ?? '支付失败，请重试');
                    }
                  } else if (actionType === 'REFUND') {
                    const res = await performAction('REFUND', activeOrder, { reason: refundReason });
                    if (res.ok) {
                      Toast.success('退款成功');
                      setActionModalOpen(false);
                      refresh();
                    } else {
                      Toast.error(res.message ?? '退款失败');
                    }
                  } else if (actionType === 'SHIP') {
                    const res = await performAction('SHIP', activeOrder, { trackingNo: shippingNo });
                    if (res.ok) {
                      Toast.success('发货成功');
                      setActionModalOpen(false);
                      refresh();
                    } else {
                      Toast.error(res.message ?? '发货失败');
                    }
                  }
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : String(e ?? '操作失败');
                  Toast.error(msg);
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              {actionType === 'PAY' ? '去支付' : actionType === 'REFUND' ? '确认退款' : '确认发货'}
            </Button>
          </div>
        }
      >
        {!activeOrder ? (
          <div style={{ padding: 24 }}>未选择订单</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
            <div>订单：{activeOrder.id}</div>
            <div>用户：{activeOrder.userName}</div>
            <div>
              金额：{activeOrder.amount.toFixed(2)} {activeOrder.currency}
            </div>
            <div>当前状态：{activeOrder.status}</div>
            {actionType === 'REFUND' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13 }}>退款原因（可选）</label>
                <Input
                  value={refundReason}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRefundReason(e.target.value)}
                  placeholder="请输入退款原因"
                />
              </div>
            ) : null}
            {actionType === 'SHIP' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13 }}>运单号（可选）</label>
                <Input
                  value={shippingNo}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setShippingNo(e.target.value)}
                  placeholder="请输入运单号"
                />
              </div>
            ) : null}
          </div>
        )}
      </Modal>
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
