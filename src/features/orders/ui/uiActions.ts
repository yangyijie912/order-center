import type { Order, OrderStatus } from '../domain/types';
import type { OrderContext, OrderEvent } from '../domain/stateMachine';
import { can as canTransition } from '../domain/stateMachine';
import { canActionOnOrder } from '../domain/rules';

export type UIActionKey = 'VIEW_DETAIL' | 'CANCEL' | 'DELETE' | 'REFUND' | 'PAY' | 'SHIP';

export const UI_ACTIONS: Record<
  UIActionKey,
  {
    label: string;
    eventType?: OrderEvent['type'];
    confirm?: { title?: string; description?: string; okText?: string; cancelText?: string; okVariant?: string };
    /** 可选十六进制颜色，由组件使用作为按钮文本色 */
    color?: string;
  }
> = {
  VIEW_DETAIL: { label: '详情', color: '#4FA3FF' },
  PAY: { label: '支付', eventType: 'PAY', color: '#0B66FF' },
  CANCEL: {
    label: '取消',
    eventType: 'CANCEL',
    color: '#585a61',
    confirm: { title: '确认取消？', okText: '确定', cancelText: '取消' },
  },
  DELETE: {
    label: '删除',
    confirm: { title: '确认删除？', okText: '删除', cancelText: '取消', okVariant: 'ghost' },
    color: '#FF4D4F',
  },
  REFUND: { label: '退款', eventType: 'REFUND', color: '#FF7A45' },
  SHIP: { label: '发货', eventType: 'SHIP', color: '#16A34A' },
};

export type AvailableAction = { type: string; enabled: boolean; reason?: string };

/**
 * 为 UI 返回当前订单可见的动作（包含启用/禁用与原因）
 * - 纯 UI 层函数，调用 domain 的 `can` / `canActionOnOrder` 完成判断
 */
export function getAvailableUIActions(status: OrderStatus, ctx: OrderContext): AvailableAction[] {
  const actions: AvailableAction[] = [];

  for (const key of Object.keys(UI_ACTIONS) as UIActionKey[]) {
    const def = UI_ACTIONS[key];
    if (def.eventType) {
      const allowed = canTransition(status, def.eventType, ctx);
      actions.push({ type: key, enabled: allowed === true, reason: allowed === true ? undefined : allowed.reason });
    } else {
      // 非状态机事件：基于状态的简单判断（例如 DELETE/VIEW）
      const o = ctx.order;
      const pseudoOrder: Order = {
        id: o.id,
        userId: o.userId,
        userName: '',
        amount: o.amount,
        currency: 'CNY',
        status: o.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemsCount: 0,
      };
      const ok = canActionOnOrder(pseudoOrder, key === 'DELETE' ? 'DELETE' : 'VIEW_DETAIL');
      actions.push({ type: key, enabled: !!ok, reason: ok ? undefined : '不可用' });
    }
  }

  return actions;
}
