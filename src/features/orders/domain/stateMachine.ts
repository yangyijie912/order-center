import type { OrderStatus } from './types';
import { cancelOrder, payOrder, refundOrder } from '../services/ordersApi';

/**
 * 订单状态机定义
 *
 * 本文件实现了一个有限状态机（FSM），用于管理订单从创建到完成/取消的完整生命周期
 *
 * 核心概念：
 * - 状态 (State): pending, paid, shipped, completed, cancelled, refunded
 * - 事件 (Event): 导致状态转移的行为（PAY, SHIP, CONFIRM_RECEIPT 等）
 * - 守卫 (Guard): 权限和业务规则检查，决定是否允许转移
 * - 副作用 (Effect): 状态转移时的副作用处理（如调用 API）
 */

/**
 * 订单状态转移事件类型定义
 * 每个事件类型对应一个具体的用户操作或系统触发的动作
 * 支持可选的 payload 用于传递额外数据（如发货单号、退款原因）
 */
export type OrderEvent =
  | { type: 'PAY' }
  | { type: 'CANCEL' }
  | { type: 'SHIP'; payload?: { trackingNo?: string } }
  | { type: 'CONFIRM_RECEIPT' }
  | { type: 'REFUND'; payload?: { reason?: string } };

/**
 * 状态机上下文：维护转移过程中需要的业务数据
 *
 * order: 订单的关键字段（不含完整的 Order 对象，避免状态爆炸）
 * role: 操作者的角色，用于权限检查（admin/operator 可管理，viewer 只读）
 * isRefundable: 业务规则标志，指示订单是否可退款（由后端计算）
 */
export type OrderContext = {
  order: {
    id: string;
    userId: string;
    amount: number;
    status: OrderStatus;
  };
  role?: 'admin' | 'operator' | 'viewer';
  isRefundable?: boolean;
};

/**
 * 守卫验证结果类型
 * true: 允许转移
 * { ok: false, reason }: 拒绝转移，并提供用户友好的拒绝原因
 */
type GuardResult = true | { ok: false; reason: string };

/**
 * 状态转移配置对象
 * target: 转移的目标状态
 * guard: 可选的权限/规则检查函数，返回 GuardResult
 * effect: 可选的副作用处理函数（如 API 调用），状态转移前执行
 */
type Transition = {
  target: OrderStatus;
  guard?: (ctx: OrderContext) => GuardResult;
  effect?: (ctx: OrderContext, event: OrderEvent) => Promise<void>;
};

/**
 * 状态转移表
 * 定义了每个状态下允许的事件及其转移规则
 */
/**
 * 副作用处理器集中管理
 * 每个 effect 函数对应一个状态转移事件的副作用（如 API 调用）
 * _event 参数保留用于未来扩展（如支持事件 payload），暂时未使用
 */
export const effects = {
  /** 支付处理：订单从 pending 转移到 paid */
  PAY: async (ctx: OrderContext, _event: OrderEvent): Promise<void> => {
    // 调用支付 API
    await payOrder(ctx.order.id);
  },

  /** 取消处理：调用后端取消接口 */
  CANCEL: async (ctx: OrderContext, _event: OrderEvent): Promise<void> => {
    // 使用真实取消 API
    await cancelOrder(ctx.order.id);
  },

  /** 发货处理：订单从 paid 转移到 shipped */
  SHIP: async (ctx: OrderContext, _event: OrderEvent): Promise<void> => {
    // TODO: 调用真实发货 API
    console.log(`[SHIP] Order ${ctx.order.id}`);
  },

  /** 确认收货处理：订单从 shipped 转移到 completed */
  CONFIRM_RECEIPT: async (ctx: OrderContext, _event: OrderEvent): Promise<void> => {
    // TODO: 调用真实确认收货 API
    console.log(`[CONFIRM_RECEIPT] Order ${ctx.order.id}`);
  },

  /** 退款处理：订单从 paid 转移到 refunded */
  REFUND: async (ctx: OrderContext, _event: OrderEvent): Promise<void> => {
    // 调用退款 API
    await refundOrder(ctx.order.id);
  },
};

export const orderTransitions: Record<OrderStatus, Record<string, Transition>> = {
  // 待支付：可以支付或取消
  pending: {
    PAY: { target: 'paid', effect: effects.PAY },
    CANCEL: { target: 'cancelled', effect: effects.CANCEL },
  },
  // 已支付：可以发货、退款（需权限和条件）
  paid: {
    SHIP: {
      target: 'shipped',
      guard: (ctx) => (ctx.role !== 'viewer' ? true : { ok: false, reason: '无权限发货' }),
      effect: effects.SHIP,
    },
    REFUND: {
      target: 'refunded',
      guard: (ctx) => (ctx.isRefundable ?? true ? true : { ok: false, reason: '该订单不可退款' }),
      effect: effects.REFUND,
    },
  },
  // 已发货：可以确认收货
  shipped: {
    CONFIRM_RECEIPT: { target: 'completed', effect: effects.CONFIRM_RECEIPT },
  },
  // 已完成：终态，无后续操作
  completed: {},
  // 已取消：终态，无后续操作
  cancelled: {},
  // 已退款：终态，无后续操作
  refunded: {},
};

/**
 * 检查订单转移操作是否被允许
 * 用于 UI 层决定是否渲染操作按钮或显示禁用状态
 * @param status 当前订单状态
 * @param eventType 要执行的事件类型
 * @param ctx 上下文（包含权限、业务属性等）
 * @returns 允许返回 true，否则返回包含拒绝原因的对象
 */
export function can(status: OrderStatus, eventType: OrderEvent['type'], ctx: OrderContext): GuardResult {
  const t = orderTransitions[status]?.[eventType];
  if (!t) return { ok: false, reason: '当前状态不支持该操作' };
  return t.guard ? t.guard(ctx) : true;
}

/**
 * 执行状态流转：先验证权限，再调用副作用，最后更新状态
 * 这是核心的状态机转移引擎
 * @param status 当前订单状态
 * @param event 要执行的事件（包含事件类型和可选 payload）
 * @param ctx 上下文信息（订单数据、权限等）
 * @returns 返回下一个状态
 * @throws 如果转移不存在、权限检查失败或 effect 执行失败则抛出错误
 */
export async function transition(
  status: OrderStatus,
  event: OrderEvent,
  ctx: OrderContext
): Promise<{ next: OrderStatus }> {
  const t = orderTransitions[status]?.[event.type];
  if (!t) throw new Error('INVALID_TRANSITION');

  const allowed = t.guard ? t.guard(ctx) : true;
  if (allowed !== true) throw new Error(allowed.reason);

  if (t.effect) await t.effect(ctx, event);
  return { next: t.target };
}

/**
 * 可用操作的描述对象
 * type: 操作类型标识
 * enabled: 该操作是否可执行（已通过权限和业务规则检查）
 * reason: 如果禁用，提供用户友好的拒绝原因
 */
export type AvailableAction = {
  type: string;
  enabled: boolean;
  reason?: string;
};

/**
 * 获取当前状态下的所有可用操作列表
 * 遍历转移表中定义的所有操作，逐一检查权限和业务规则
 * 用于 UI 动态渲染操作按钮（可用的激活，禁用的显示灰色 + 禁用原因）
 * @param status 当前订单状态
 * @param ctx 上下文（权限、业务属性等）
 * @returns 操作列表，包含每个操作的启用状态和禁用原因
 */
export function getAvailableActions(status: OrderStatus, ctx: OrderContext): AvailableAction[] {
  return Object.entries(orderTransitions[status] || {}).map(([type]) => {
    const allowed = can(status, type as OrderEvent['type'], ctx);
    return {
      type,
      enabled: allowed === true,
      reason: allowed === true ? undefined : allowed.reason,
    };
  });
}
