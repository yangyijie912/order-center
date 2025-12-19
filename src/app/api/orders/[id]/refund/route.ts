import { NextResponse, type NextRequest } from 'next/server';
import { __computeIsRefundable, __getDB, __setDB } from '../../route';
import { canTransition } from '@/features/orders/domain/stateMachine';
import { getRoleFromRequest } from '@/features/auth/server';

// 退款接口：仅允许 paid -> refunded
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const id = decodeURIComponent(params.id);
    const db = __getDB();
    const idx = db.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'NotFound', message: '订单不存在' }, { status: 404 });

    const o = db[idx];

    const role = getRoleFromRequest(_req) ?? 'viewer';
    const isRefundable = __computeIsRefundable(o);
    const guard = canTransition(o.status, 'REFUND', {
      order: { id: o.id, userId: o.userId, amount: o.amount, status: o.status },
      role,
      isRefundable,
    });

    if (guard !== true) {
      return NextResponse.json(
        { error: 'InvalidTransition', message: guard.reason ?? '不允许的操作' },
        { status: 409 }
      );
    }

    db[idx] = { ...o, status: 'refunded', updatedAt: new Date().toISOString() };
    __setDB(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[refund.route] unexpected error:', err);
    return NextResponse.json({ error: 'InternalError', message: '服务器内部错误' }, { status: 500 });
  }
}
