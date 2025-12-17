import type { OrderStatus } from './types';
import { cancelOrder } from '../services/ordersApi';

/**
 * 状态机事件定义
 */
export type OrderEvent =
  | { type: 'PAY' }
  | { type: 'CANCEL' }
  | { type: 'SHIP'; payload?: { trackingNo?: string } }
  | { type: 'CONFIRM_RECEIPT' }
  | { type: 'REFUND'; payload?: { reason?: string } };

/**
 * 状态机上下文
 */
export type MachineContext = {
  orderId: string;
  role: 'admin' | 'operator' | 'viewer';
  amount: number;
  isRefundable?: boolean;
};

/**
 * 权限校验和副作用结果
 */
type GuardResult = true | { ok: false; reason: string };

/**
 * 状态转移配置
 */
type Transition = {
  target: OrderStatus;
  guard?: (ctx: MachineContext) => GuardResult;
  effect?: (ctx: MachineContext) => Promise<void>;
};

/**
 * 状态转移表
 * 定义了每个状态下允许的事件及其转移规则
 */
/**
 * 副作用（API 调用）集中管理
 * 可根据实际需求连接真实 API
 */
export const effects = {
  PAY: async (ctx: MachineContext): Promise<void> => {
    // TODO: 调用支付 API
    console.log(`[PAY] Order ${ctx.orderId}, Amount: ${ctx.amount}`);
  },
  CANCEL: async (ctx: MachineContext): Promise<void> => {
    // 使用真实取消 API
    await cancelOrder(ctx.orderId);
  },
  SHIP: async (ctx: MachineContext): Promise<void> => {
    // TODO: 调用发货 API
    console.log(`[SHIP] Order ${ctx.orderId}`);
  },
  CONFIRM_RECEIPT: async (ctx: MachineContext): Promise<void> => {
    // TODO: 调用确认收货 API
    console.log(`[CONFIRM_RECEIPT] Order ${ctx.orderId}`);
  },
  REFUND: async (ctx: MachineContext): Promise<void> => {
    // TODO: 调用退款 API
    console.log(`[REFUND] Order ${ctx.orderId}, Amount: ${ctx.amount}`);
  },
};

export const orderTransitions: Record<OrderStatus, Record<string, Transition>> = {
  pending: {
    PAY: { target: 'paid', effect: effects.PAY },
    CANCEL: { target: 'cancelled', effect: effects.CANCEL },
  },
  paid: {
    SHIP: {
      target: 'shipped',
      guard: (ctx) => (ctx.role !== 'viewer' ? true : { ok: false, reason: '无权限发货' }),
      effect: effects.SHIP,
    },
    REFUND: {
      target: 'refunded',
      guard: (ctx) => (ctx.isRefundable ? true : { ok: false, reason: '该订单不可退款' }),
      effect: effects.REFUND,
    },
  },
  shipped: {
    CONFIRM_RECEIPT: { target: 'completed', effect: effects.CONFIRM_RECEIPT },
  },
  completed: {},
  cancelled: {},
  refunded: {},
};

/**
 * 判断是否允许执行某个事件
 * @param status 当前订单状态
 * @param eventType 事件类型
 * @param ctx 状态机上下文
 * @returns 允许返回 true，否则返回包含原因的对象
 */
export function can(status: OrderStatus, eventType: OrderEvent['type'], ctx: MachineContext): GuardResult {
  const t = orderTransitions[status]?.[eventType];
  if (!t) return { ok: false, reason: '当前状态不支持该操作' };
  return t.guard ? t.guard(ctx) : true;
}

/**
 * 执行状态流转
 * @param status 当前订单状态
 * @param event 触发的事件
 * @param ctx 状态机上下文
 * @returns 返回下一个状态
 * @throws 如果转移不合法或权限检查失败，抛出错误
 */
export async function transition(
  status: OrderStatus,
  event: OrderEvent,
  ctx: MachineContext
): Promise<{ next: OrderStatus }> {
  const t = orderTransitions[status]?.[event.type];
  if (!t) throw new Error('INVALID_TRANSITION');

  const allowed = t.guard ? t.guard(ctx) : true;
  if (allowed !== true) throw new Error(allowed.reason);

  if (t.effect) await t.effect(ctx);
  return { next: t.target };
}

/**
 * 可用操作描述
 */
export type AvailableAction = {
  type: string;
  enabled: boolean;
  reason?: string;
};

/**
 * 获取当前状态下的可用操作列表
 * 用于 UI 渲染操作按钮
 * @param status 当前订单状态
 * @param ctx 状态机上下文
 * @returns 可用操作数组
 */
export function getAvailableActions(status: OrderStatus, ctx: MachineContext): AvailableAction[] {
  return Object.entries(orderTransitions[status] || {}).map(([type]) => {
    const allowed = can(status, type as OrderEvent['type'], ctx);
    return {
      type,
      enabled: allowed === true,
      reason: allowed === true ? undefined : allowed.reason,
    };
  });
}
