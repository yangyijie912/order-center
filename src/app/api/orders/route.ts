import { NextResponse } from 'next/server';
import type { Order, OrderListResponse, OrderStatus } from '@/features/orders/domain/types';

declare global {
  interface GlobalThis {
    // 在全局挂载用于开发环境下的内存 DB，便于在不同请求间保留模拟数据
    __ORDER_DB__?: Order[];
  }
}

const STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'paying',
  'payment_failed',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
];

// 模拟“数据库”——注意：dev 热更新/无服务器环境可能会重置
let DB: Order[] | undefined = globalThis.__ORDER_DB__;

function shouldResolvePaying(o: Order, nowMs: number, resolveAfterMs: number): boolean {
  if (o.status !== 'paying') return false;
  const t = new Date(o.updatedAt).getTime();
  if (Number.isNaN(t)) return true;
  return nowMs - t >= resolveAfterMs;
}

function pickFinalStatusDeterministic(o: Order): Extract<OrderStatus, 'paid' | 'payment_failed'> {
  const s = `${o.id}|${o.updatedAt}`;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? 'paid' : 'payment_failed';
}

export function __settlePayingOrders(db: Order[], opts?: { resolveAfterMs?: number; nowMs?: number }): Order[] {
  const nowMs = opts?.nowMs ?? Date.now();
  const resolveAfterMs = opts?.resolveAfterMs ?? 5000;

  let changed = false;
  let next = db;

  for (let i = 0; i < db.length; i++) {
    const o = db[i];
    if (!shouldResolvePaying(o, nowMs, resolveAfterMs)) continue;

    if (!changed) {
      next = db.slice();
      changed = true;
    }

    const finalStatus = pickFinalStatusDeterministic(o);
    next[i] = { ...o, status: finalStatus, updatedAt: new Date(nowMs).toISOString() };
  }

  return next;
}

function seed(): Order[] {
  const now = Date.now();
  const users = ['宝', '小可爱', 'Alice', 'Bob', 'Carol', 'Dave'];
  const list: Order[] = Array.from({ length: 87 }).map((_, i) => {
    const status = STATUSES[i % STATUSES.length];
    const createdAt = new Date(now - i * 1000 * 60 * 60 * 8).toISOString();
    const updatedAt = new Date(now - i * 1000 * 60 * 60 * 2).toISOString();
    return {
      id: `OD${String(100000 + i)}`,
      userId: `U${String(1000 + (i % 30))}`,
      userName: users[i % users.length],
      amount: Number(((i % 200) + 19.9).toFixed(2)),
      currency: 'CNY',
      status,
      createdAt,
      updatedAt,
      itemsCount: (i % 5) + 1,
    };
  });
  return list;
}

if (!DB) {
  DB = seed();
  globalThis.__ORDER_DB__ = DB;
}

function q(req: Request) {
  const { searchParams } = new URL(req.url);
  return searchParams;
}

/**
 * GET /api/orders
 * - 支持关键字、状态、创建时间范围、金额范围、排序、分页等参数
 * - 在内存 DB 上进行过滤、排序与分页后返回结果
 */
export async function GET(req: Request) {
  const sp = q(req);
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(5, Number(sp.get('pageSize') ?? 10)));

  const keyword = (sp.get('keyword') ?? '').trim();
  const status = (sp.get('status') ?? '').trim() as OrderStatus | '';
  const createdFrom = sp.get('createdFrom') ?? '';
  const createdTo = sp.get('createdTo') ?? '';
  const minAmount = sp.get('minAmount') ? Number(sp.get('minAmount')) : null;
  const maxAmount = sp.get('maxAmount') ? Number(sp.get('maxAmount')) : null;

  const sortBy = (sp.get('sortBy') ?? 'createdAt') as 'createdAt' | 'amount';
  const sortOrder = (sp.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

  // 兜底：若支付模拟器的 setTimeout 未执行，拉列表时也能把 paying 结算到最终态
  const db = __getDB();
  const settled = __settlePayingOrders(db);
  if (settled !== db) __setDB(settled);

  let list = (settled !== db ? settled : db).slice();

  // 关键字过滤（支持订单号 / 用户名 / 电话）
  if (keyword) {
    const kw = keyword.toLowerCase();
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(kw) ||
        o.userName.toLowerCase().includes(kw) ||
        (o.phone ?? '').toLowerCase().includes(kw)
    );
  }

  // 状态过滤
  if (status) {
    list = list.filter((o) => o.status === status);
  }

  // 创建时间范围过滤，注意 createdTo 需要包含当天的 23:59:59
  if (createdFrom) {
    const from = new Date(createdFrom).getTime();
    if (!Number.isNaN(from)) list = list.filter((o) => new Date(o.createdAt).getTime() >= from);
  }
  if (createdTo) {
    const to = new Date(createdTo).getTime();
    if (!Number.isNaN(to)) list = list.filter((o) => new Date(o.createdAt).getTime() <= to + 24 * 60 * 60 * 1000 - 1);
  }

  // 金额范围过滤
  if (minAmount != null && Number.isFinite(minAmount)) list = list.filter((o) => o.amount >= minAmount);
  if (maxAmount != null && Number.isFinite(maxAmount)) list = list.filter((o) => o.amount <= maxAmount);

  // 排序
  list.sort((a, b) => {
    const av = sortBy === 'amount' ? a.amount : new Date(a.createdAt).getTime();
    const bv = sortBy === 'amount' ? b.amount : new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
  });

  // 分页
  const total = list.length;
  const start = (page - 1) * pageSize;
  const paged = list.slice(start, start + pageSize);

  const res: OrderListResponse = { list: paged, total, page, pageSize };
  return NextResponse.json(res);
}

// helper for other routes
export function __getDB(): Order[] {
  if (!DB) {
    DB = seed();
    globalThis.__ORDER_DB__ = DB;
  }
  return DB;
}

export function __setDB(next: Order[]) {
  DB = next;
  globalThis.__ORDER_DB__ = DB;
}
