import type { Order, OrderStatus } from './types';

// 操作类型定义
export type OrderAction = 'VIEW_DETAIL' | 'CANCEL' | 'DELETE' | 'REFUND';

// 基于订单状态定义每种动作是否允许执行
// 使用 Partial<Record<OrderStatus, ...>> 来兼容新增的异常/中间态
const ACTIONS_BY_STATUS: Partial<Record<OrderStatus, Record<OrderAction, boolean>>> = {
  pending: { VIEW_DETAIL: true, CANCEL: true, DELETE: false, REFUND: false },
  paid: { VIEW_DETAIL: true, CANCEL: false, DELETE: false, REFUND: true },
  shipped: { VIEW_DETAIL: true, CANCEL: false, DELETE: false, REFUND: true },
  completed: { VIEW_DETAIL: true, CANCEL: false, DELETE: true, REFUND: false },
  cancelled: { VIEW_DETAIL: true, CANCEL: false, DELETE: true, REFUND: false },
  refunded: { VIEW_DETAIL: true, CANCEL: false, DELETE: true, REFUND: false },
};

/**
 * 判断某个状态下是否允许某操作
 */
export function canAction(status: OrderStatus, action: OrderAction): boolean {
  // 对未声明的状态采用保守策略：仅允许查看详情
  const r = ACTIONS_BY_STATUS[status];
  if (!r) return action === 'VIEW_DETAIL';
  return r[action];
}

/**
 * 判断在具体订单对象上是否允许某操作（基于订单当前状态）
 */
export function canActionOnOrder(order: Order, action: OrderAction): boolean {
  return canAction(order.status, action);
}

/**
 * 根据提供的订单与 id 列表，将 id 分为允许执行与跳过两类
 * - 常用于批量操作：先过滤出允许操作的 id，跳过不允许的 id
 * @param orders - 当前已加载的订单数据（用于按 id 查找对应订单）
 * @param ids - 待处理的 id 列表（例如从表格选择项）
 * @param action - 要尝试的动作（'cancel' | 'delete'）
 */
export function partitionIdsByAction(
  orders: Order[],
  ids: string[],
  action: 'cancel' | 'delete'
): { allowedIds: string[]; skippedIds: string[] } {
  const allowed: string[] = [];
  const skipped: string[] = [];
  const byId = new Map(orders.map((o) => [o.id, o]));

  for (const id of ids) {
    const o = byId.get(id);
    if (!o) {
      skipped.push(id);
      continue;
    }

    const ok = action === 'cancel' ? canActionOnOrder(o, 'CANCEL') : canActionOnOrder(o, 'DELETE');

    (ok ? allowed : skipped).push(id);
  }

  return { allowedIds: allowed, skippedIds: skipped };
}
