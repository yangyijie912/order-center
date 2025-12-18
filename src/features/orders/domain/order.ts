import type { Order, OrderStatus } from './types';
import type { OrderContext, OrderEvent } from './stateMachine';
import { can as canTransition, transition } from './stateMachine';
import { canActionOnOrder } from './rules';

export type Role = 'admin' | 'operator' | 'viewer';

/**
 * OrderEntity
 * - 作为领域层的订单对象包装器，提供纯业务方法：can / next / statusLabel
 * - 不包含 React、toast 或任何 UI 逻辑
 */
export class OrderEntity {
  order: Order;
  role?: Role;
  isRefundable?: boolean;

  constructor(order: Order, opts?: { role?: Role; isRefundable?: boolean }) {
    this.order = { ...order };
    this.role = opts?.role;
    this.isRefundable = opts?.isRefundable;
  }

  get status(): OrderStatus {
    return this.order.status;
  }

  /**
   * 简单的本地化状态标签（UI 可覆盖或扩展）
   */
  statusLabel(): string {
    // 使用 Partial 避免每次扩展 OrderStatus 都需要在这里同步
    const labels: Partial<Record<OrderStatus, string>> = {
      pending: '待付款',
      paid: '已支付',
      paying: '支付中',
      payment_failed: '支付失败',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
    };
    return labels[this.order.status] ?? this.order.status;
  }

  private buildCtx(): OrderContext {
    return {
      order: {
        id: this.order.id,
        userId: this.order.userId,
        amount: this.order.amount,
        status: this.order.status,
      },
      role: this.role,
      isRefundable: this.isRefundable,
    };
  }

  /**
   * 判断是否允许触发某个状态机事件（返回 boolean）
   */
  can(eventType: OrderEvent['type']): boolean {
    const ctx = this.buildCtx();
    const res = canTransition(this.order.status, eventType, ctx);
    return res === true;
  }

  /**
   * 判断 UI 层的高阶动作是否允许（例如 DELETE/VIEW_DETAIL/REFUND/CANCEL）
   * UI 可以使用此方法判断按钮是否可用，避免在 UI 中直接写业务判断
   */
  canUIAction(actionKey: string): boolean {
    // 如果 actionKey 对应状态机事件，直接委托给 can
    const eventTypes = ['PAY', 'CANCEL', 'SHIP', 'CONFIRM_RECEIPT', 'REFUND'];
    if (eventTypes.includes(actionKey)) {
      return this.can(actionKey as OrderEvent['type']);
    }

    // 否则退回到基于订单状态的旧规则判断（例如 DELETE/VIEW_DETAIL）
    // 使用 domain.rules 的 canActionOnOrder
    try {
      // map UI keys to rule actions
      const map: Record<string, 'DELETE' | 'VIEW_DETAIL'> = { DELETE: 'DELETE', VIEW_DETAIL: 'VIEW_DETAIL' };
      const rule = map[actionKey];
      if (!rule) return false;
      return canActionOnOrder(this.order, rule);
    } catch {
      return false;
    }
  }

  /**
   * 触发状态机事件并更新内部状态（会调用 stateMachine 的 effect）
   * - 返回转移结果
   */
  async next(eventType: OrderEvent['type'], event?: OrderEvent): Promise<{ next: OrderStatus; message?: string }> {
    const ctx = this.buildCtx();
    const e: OrderEvent = event ? event : ({ type: eventType } as OrderEvent);
    const result = await transition(this.order.status, e, ctx);
    this.order.status = result.next;
    return result;
  }

  toObject(): Order {
    return { ...this.order };
  }
}
