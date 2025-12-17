'use client';

import { useState } from 'react';
import { cancelOrder, deleteOrder } from '../services/ordersApi';

/**
 * useOrderActions
 * - 封装对单个订单的取消和删除动作
 * - 返回 `pendingId` 用于标识当前正在执行操作的订单（可用于禁用按钮或显示 loading）
 */
export function useOrderActions() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  // 取消订单，返回 { ok: true } 或 { ok: false, message }
  async function onCancel(id: string) {
    setPendingId(id);
    try {
      await cancelOrder(id);
      return { ok: true as const };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e ?? 'Cancel failed');
      return { ok: false as const, message };
    } finally {
      setPendingId(null);
    }
  }

  // 删除订单，返回 { ok: true } 或 { ok: false, message }
  async function onDelete(id: string) {
    setPendingId(id);
    try {
      await deleteOrder(id);
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
