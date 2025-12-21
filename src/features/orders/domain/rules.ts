import type { Order, OrderStatus } from './types';
import type { Role } from '@/features/auth/roles';
import { roleAllows } from '@/features/auth/roles';

// 操作类型定义（UI 高阶动作）
export type OrderAction = 'VIEW_DETAIL' | 'CANCEL' | 'DELETE' | 'REFUND' | 'SHIP';

export type CheckFailReason = 'ROLE_FORBIDDEN' | 'STATUS_FORBIDDEN' | 'MISSING_ROLE';

export type RuleResult =
  | true
  | {
      ok: false;
      reason: string; // human-friendly message (保持兼容现有代码)
      code: CheckFailReason;
    };

// 基于订单状态定义每种动作是否允许执行（与以前相同）
const ACTIONS_BY_STATUS: Partial<Record<OrderStatus, Record<OrderAction, boolean>>> = {
  pending: { VIEW_DETAIL: true, CANCEL: true, DELETE: false, REFUND: false, SHIP: false },
  paid: { VIEW_DETAIL: true, CANCEL: false, DELETE: false, REFUND: true, SHIP: true },
  shipped: { VIEW_DETAIL: true, CANCEL: false, DELETE: false, REFUND: true, SHIP: false },
  completed: { VIEW_DETAIL: true, CANCEL: false, DELETE: true, REFUND: false, SHIP: false },
  cancelled: { VIEW_DETAIL: true, CANCEL: false, DELETE: true, REFUND: false, SHIP: false },
  refunded: { VIEW_DETAIL: true, CANCEL: false, DELETE: true, REFUND: false, SHIP: false },
};

export function canAction(status: OrderStatus, action: OrderAction): boolean {
  const r = ACTIONS_BY_STATUS[status];
  if (!r) return action === 'VIEW_DETAIL';
  return Boolean(r[action]);
}

export function canActionOnOrder(order: Order | { status: OrderStatus }, action: OrderAction): boolean {
  return canAction(order.status, action);
}

// rolePolicies / roleAllows 已抽取到 src/features/auth/roles.ts

// 具体动作的规则封装：同时考虑状态与角色（返回 RuleResult）
export type OrderLike = { status: OrderStatus; isRefundable?: boolean } & Partial<Order>;

export function canDelete(order: OrderLike, role?: Role): RuleResult {
  if (!canActionOnOrder(order, 'DELETE'))
    return { ok: false, reason: '当前状态不允许删除订单', code: 'STATUS_FORBIDDEN' };
  if (!role) return { ok: false, reason: '缺少角色信息', code: 'MISSING_ROLE' };
  if (!roleAllows('delete', role)) return { ok: false, reason: '仅管理员可删除订单', code: 'ROLE_FORBIDDEN' };
  return true;
}

export function canRefund(order: OrderLike, role: Role): RuleResult {
  if (!canActionOnOrder(order, 'REFUND')) return { ok: false, reason: '当前状态不允许退款', code: 'STATUS_FORBIDDEN' };
  if (!order.isRefundable) return { ok: false, reason: '该订单不可退款', code: 'STATUS_FORBIDDEN' };
  if (!roleAllows('refund', role)) return { ok: false, reason: '无权限退款', code: 'ROLE_FORBIDDEN' };
  return true;
}

export function canShip(order: OrderLike, role: Role): RuleResult {
  if (!canActionOnOrder(order, 'SHIP')) return { ok: false, reason: '当前状态不允许发货', code: 'STATUS_FORBIDDEN' };
  if (!roleAllows('ship', role)) return { ok: false, reason: '无权限发货', code: 'ROLE_FORBIDDEN' };
  return true;
}

export function partitionIdsByAction(
  orders: Order[],
  ids: string[],
  action: 'cancel' | 'delete',
  role?: Role
): {
  allowedIds: string[];
  skippedIds: string[]; // 保持老 API
  blocked?: { id: string; reason: string; code: CheckFailReason }[];
} {
  const allowed: string[] = [];
  const skipped: string[] = [];
  const blocked: { id: string; reason: string; code: CheckFailReason }[] = [];
  const byId = new Map(orders.map((o) => [o.id, o]));

  for (const id of ids) {
    const o = byId.get(id);
    if (!o) {
      skipped.push(id);
      continue;
    }

    if (action === 'cancel') {
      const ok = canActionOnOrder(o, 'CANCEL');
      if (ok) allowed.push(id);
      else {
        skipped.push(id);
        blocked.push({ id, reason: '当前状态不允许批量取消', code: 'STATUS_FORBIDDEN' });
      }
      continue;
    }

    // action === 'delete'
    const res = canDelete(o, role);
    if (res === true) allowed.push(id);
    else {
      skipped.push(id);
      blocked.push({ id, reason: res.reason, code: res.code });
    }
  }

  return { allowedIds: allowed, skippedIds: skipped, blocked };
}
