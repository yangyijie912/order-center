'use client';

import React from 'react';
import type { Order } from '@/features/orders/domain/types';
import { Drawer } from 'beaver-ui';

type Props = { open: boolean; order?: Order | null; onClose: () => void };

export default function OrderDetailDrawer({ open, order, onClose }: Props) {
  return (
    <Drawer title="订单详情" placement="right" closable onClose={onClose} open={open} width={420}>
      {!order ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>未选择订单</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
            <strong>订单号</strong>
            <div>{order.id}</div>

            <strong>用户</strong>
            <div>
              {order.userName} <span style={{ color: '#999', fontSize: 12 }}>({order.userId})</span>
            </div>

            <strong>金额</strong>
            <div>
              {order.amount.toFixed(2)} {order.currency}
            </div>

            <strong>状态</strong>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  background: getStatusBgColor(order.status),
                  color: getStatusTextColor(order.status),
                }}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>

            <strong>创建时间</strong>
            <div>{new Date(order.createdAt).toLocaleString()}</div>

            <strong>更新时间</strong>
            <div>{new Date(order.updatedAt).toLocaleString()}</div>

            <strong>商品数量</strong>
            <div>{order.itemsCount}</div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function getStatusLabel(status: Order['status']): string {
  const labels: Record<Order['status'], string> = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  };
  return labels[status] || status;
}

function getStatusBgColor(status: Order['status']): string {
  const colors: Record<Order['status'], string> = {
    pending: '#fff4e5',
    paid: '#e6f7ff',
    shipped: '#f0f5ff',
    completed: '#f6ffed',
    cancelled: '#f5f5f5',
    refunded: '#fff1f0',
  };
  return colors[status] || '#fafafa';
}

function getStatusTextColor(status: Order['status']): string {
  const colors: Record<Order['status'], string> = {
    pending: '#b36b00',
    paid: '#096dd9',
    shipped: '#2f54eb',
    completed: '#237804',
    cancelled: '#8c8c8c',
    refunded: '#a8071a',
  };
  return colors[status] || '#222';
}
