'use client';

import { useState } from 'react';
import { deleteOrder } from '../services/ordersApi';
import type { Order } from '../domain/types';
import { transition, type MachineContext } from '../domain/stateMachine';

/**
 * useOrderActions
 * - 封装对单个订单的取消和删除动作
 * - 返回 `pendingId` 用于标识当前正在执行操作的订单（可用于禁用按钮或显示 loading）
 */
export function useOrderActions() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  // 取消订单，接入状态机：接收完整 Order 对象以便读取 status/amount 等信息
  async function onCancel(order: Order) {
    setPendingId(order.id);
    try {
      const ctx: MachineContext = { orderId: order.id, role: 'operator', amount: order.amount };
      await transition(order.status, { type: 'CANCEL' }, ctx);
      return { ok: true as const };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e ?? 'Cancel failed');
      return { ok: false as const, message };
    } finally {
      setPendingId(null);
    }
  }

  // 删除订单，保持原有实现（删除不改变状态机中的状态）
  async function onDelete(order: Order) {
    setPendingId(order.id);
    try {
      await deleteOrder(order.id);
      return { ok: true as const };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e ?? 'Delete failed');
      return { ok: false as const, message };
    } finally {
      setPendingId(null);
    }
  }

  return { pendingId, onCancel, onDelete };
}
