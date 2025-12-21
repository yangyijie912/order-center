import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../route';
import { canTransition } from '@/features/orders/domain/stateMachine';
import { canDelete } from '@/features/orders/domain/rules';
import { getRoleFromRequest } from '@/features/auth/server';

type BatchAction = { action: 'cancel' | 'delete'; ids: string[] };

export async function POST(req: NextRequest) {
  const role = getRoleFromRequest(req) ?? 'viewer';
  let body: BatchAction;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: 'InvalidRequest', message: '请求体不是有效的 JSON' }, { status: 400 });
    }
    const p = parsed as Partial<BatchAction>;
    if ((p.action !== 'cancel' && p.action !== 'delete') || !Array.isArray(p.ids)) {
      return NextResponse.json({ error: 'InvalidRequest', message: '请求参数不正确' }, { status: 400 });
    }
    const ids = p.ids.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    body = { action: p.action, ids };
  } catch {
    return NextResponse.json({ error: 'InvalidRequest', message: '请求体不是有效的 JSON' }, { status: 400 });
  }

  const db = __getDB();

  const successIds: string[] = [];
  const skippedIds: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  if (body.action === 'cancel') {
    const next = db.slice();
    for (const id of body.ids) {
      const idx = next.findIndex((o) => o.id === id);
      if (idx === -1) {
        skippedIds.push(id);
        failed.push({ id, reason: '订单不存在' });
        continue;
      }
      const o = next[idx];
      const guard = canTransition(o.status, 'CANCEL', {
        order: { id: o.id, userId: o.userId, amount: o.amount, status: o.status },
        role,
      });
      if (guard !== true) {
        skippedIds.push(id);
        failed.push({ id, reason: guard.reason ?? '不允许的操作' });
        continue;
      }
      next[idx] = { ...o, status: 'cancelled', updatedAt: new Date().toISOString() };
      successIds.push(id);
    }
    __setDB(next);
    return NextResponse.json({ successIds, skippedIds, failed });
  }

  if (body.action === 'delete') {
    const next = db.slice();
    for (const id of body.ids) {
      const idx = next.findIndex((o) => o.id === id);
      if (idx === -1) {
        skippedIds.push(id);
        failed.push({ id, reason: '订单不存在' });
        continue;
      }
      const o = next[idx];
      const allowed = canDelete(o, role);
      if (allowed !== true) {
        skippedIds.push(id);
        failed.push({ id, reason: allowed.reason ?? '不允许的操作' });
        continue;
      }
      next.splice(idx, 1);
      successIds.push(id);
    }
    __setDB(next);
    return NextResponse.json({ successIds, skippedIds, failed });
  }

  return NextResponse.json({ error: 'InvalidRequest', message: '无效的 action' }, { status: 400 });
}
