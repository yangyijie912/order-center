'use client';

import { useState } from 'react';
import type { Order } from '../domain/types';
import { deleteOrder } from '../services/ordersApi';
import type { OrderContext } from '../domain/stateMachine';
import { orderTransitions, type OrderEvent } from '../domain/stateMachine';

type ActionResult = { ok: boolean; message?: string };

/**
 * useOrderActions
 * - 返回 onCancel 和 onDelete 方法供调用
 */
export function useOrderActions() {
  const [pending, setPending] = useState<{ [key: string]: boolean }>({});

  const onCancel = async (order: Order): Promise<ActionResult> => {
    const key = `cancel_${order.id}`;
    try {
      setPending((p) => ({ ...p, [key]: true }));

      // 检查转移是否允许
      const t = orderTransitions[order.status]?.CANCEL;
      if (!t) {
        return { ok: false, message: '当前状态不支持取消操作' };
      }

      // 构建上下文并执行 effect
      const ctx: OrderContext = {
        order: {
          id: order.id,
          userId: order.userId,
          amount: order.amount,
          status: order.status,
        },
      };
      if (t.effect) {
        await t.effect(ctx, { type: 'CANCEL' } as OrderEvent);
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '取消订单失败';
      return { ok: false, message: msg };
    } finally {
      setPending((p) => {
        const newPending = { ...p };
        delete newPending[key];
        return newPending;
      });
    }
  };

  const onDelete = async (order: Order): Promise<ActionResult> => {
    const key = `delete_${order.id}`;
    try {
      setPending((p) => ({ ...p, [key]: true }));
      await deleteOrder(order.id);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除订单失败';
      return { ok: false, message: msg };
    } finally {
      setPending((p) => {
        const newPending = { ...p };
        delete newPending[key];
        return newPending;
      });
    }
  };

  return {
    onCancel,
    onDelete,
    pending,
  };
}
