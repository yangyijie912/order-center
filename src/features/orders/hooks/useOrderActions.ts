'use client';

import { useState } from 'react';
import type { Order } from '../domain/types';
import { deleteOrder } from '../services/ordersApi';
import type { OrderContext, OrderEvent } from '../domain/stateMachine';
import { orderTransitions, UIActionKey } from '../domain/stateMachine';

export type ActionResult = { ok: boolean; message?: string };

/**
 * useOrderActions
 * - 返回 onCancel 和 onDelete 方法供调用
 */
export type PerformAction = (action: UIActionKey, order: Order) => Promise<ActionResult>;

export type UseOrderActionsReturn = {
  onCancel: (order: Order) => Promise<ActionResult>;
  onDelete: (order: Order) => Promise<ActionResult>;
  performAction: PerformAction;
  pending: { [key: string]: boolean };
};

export function useOrderActions(): UseOrderActionsReturn {
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

  /**
   * 通用动作执行器：根据 UI 动作分发到具体实现
   */
  const performAction = async (action: UIActionKey, order: Order): Promise<ActionResult> => {
    switch (action) {
      case 'VIEW_DETAIL':
        // UI 层自己处理打开详情抽屉，框架层这里仅返回 ok
        return { ok: true };
      case 'CANCEL':
        return await onCancel(order);
      case 'DELETE':
        return await onDelete(order);
      case 'REFUND':
        try {
          const t = orderTransitions[order.status]?.REFUND;
          if (!t) return { ok: false, message: '当前状态不支持退款' };
          const ctx: OrderContext = {
            order: { id: order.id, userId: order.userId, amount: order.amount, status: order.status },
          };
          if (t.effect) await t.effect(ctx, { type: 'REFUND' } as OrderEvent);
          return { ok: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : '退款失败';
          return { ok: false, message: msg };
        }
      default:
        return { ok: false, message: '未知动作' };
    }
  };

  return {
    onCancel,
    onDelete,
    performAction,
    pending,
  };
}
