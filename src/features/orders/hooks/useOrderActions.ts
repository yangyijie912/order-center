'use client';

import { useState } from 'react';
import type { Order } from '../domain/types';
import type { OrderEvent } from '../domain/stateMachine';
import { deleteOrder } from '../services/ordersApi';
import { OrderEntity } from '../domain/order';
import type { UIActionKey } from '../ui/uiActions';

export type ActionResult = { ok: boolean; message?: string; status?: string };

/**
 * useOrderActions
 * - 返回 onCancel 和 onDelete 方法供调用
 */
export type PerformAction = (action: UIActionKey, order: Order, payload?: unknown) => Promise<ActionResult>;

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

      const entity = new OrderEntity(order);
      await entity.next('CANCEL');
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
  const performAction = async (action: UIActionKey, order: Order, payload?: unknown): Promise<ActionResult> => {
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
          const entity = new OrderEntity(order);
          await entity.next('REFUND');
          return { ok: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : '退款失败';
          return { ok: false, message: msg };
        }
      case 'PAY':
        try {
          const entity = new OrderEntity(order);
          const r = await entity.next('PAY');

          if (r.next === 'paid') return { ok: true };
          if (r.next === 'paying') return { ok: false, message: r.message ?? '支付处理中', status: 'paying' };
          if (r.next === 'payment_failed') return { ok: false, message: r.message ?? '支付失败', status: 'failed' };

          return { ok: false, message: r.message ?? `支付异常：${r.next}` };
        } catch (e) {
          const msg = e instanceof Error ? e.message : '支付失败';
          return { ok: false, message: msg };
        }
      case 'SHIP':
        try {
          const entity = new OrderEntity(order);
          let event: OrderEvent;
          if (payload && typeof payload === 'object') {
            const p = payload as { trackingNo?: string };
            event = { type: 'SHIP', payload: { trackingNo: p.trackingNo } };
          } else {
            event = { type: 'SHIP' };
          }
          await entity.next('SHIP', event);
          return { ok: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : '发货失败';
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
