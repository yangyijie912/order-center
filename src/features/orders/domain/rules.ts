import type { Order, OrderStatus } from './types';

export type OrderAction = 'VIEW_DETAIL' | 'CANCEL' | 'DELETE' | 'REFUND';

const ACTIONS_BY_STATUS: Record<OrderStatus, Record<OrderAction, boolean>> = {
  pending:   { VIEW_DETAIL: true,  CANCEL: true,  DELETE: false, REFUND: false },
  paid:      { VIEW_DETAIL: true,  CANCEL: false, DELETE: false, REFUND: true  },
  shipped:   { VIEW_DETAIL: true,  CANCEL: false, DELETE: false, REFUND: true  },
  completed: { VIEW_DETAIL: true,  CANCEL: false, DELETE: true,  REFUND: false },
  cancelled: { VIEW_DETAIL: true,  CANCEL: false, DELETE: true,  REFUND: false },
  refunded:  { VIEW_DETAIL: true,  CANCEL: false, DELETE: true,  REFUND: false },
};

export function canAction(status: OrderStatus, action: OrderAction): boolean {
  return ACTIONS_BY_STATUS[status][action];
}

export function canActionOnOrder(order: Order, action: OrderAction): boolean {
  return canAction(order.status, action);
}

export function partitionIdsByAction(
  orders: Order[],
  ids: string[],
  action: 'cancel' | 'delete'
): { allowedIds: string[]; skippedIds: string[] } {
  const allowed: string[] = [];
  const skipped: string[] = [];
  const byId = new Map(orders.map(o => [o.id, o]));

  for (const id of ids) {
    const o = byId.get(id);
    if (!o) { skipped.push(id); continue; }

    const ok =
      action === 'cancel'
        ? canActionOnOrder(o, 'CANCEL')
        : canActionOnOrder(o, 'DELETE');

    (ok ? allowed : skipped).push(id);
  }

  return { allowedIds: allowed, skippedIds: skipped };
}
