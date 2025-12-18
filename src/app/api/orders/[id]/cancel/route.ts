import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../../route';
import { canTransition } from '@/features/orders/domain/stateMachine';

// 取消订单接口：通过状态机校验是否允许取消（如 pending -> cancelled）
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const id = decodeURIComponent(params.id);
    const db = __getDB();
    const idx = db.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'NotFound', message: '订单不存在' }, { status: 404 });

    const o = db[idx];

    const guard = canTransition(o.status, 'CANCEL', {
      order: { id: o.id, userId: o.userId, amount: o.amount, status: o.status },
      role: 'operator',
    });
    if (guard !== true) {
      return NextResponse.json(
        { error: 'InvalidTransition', message: guard.reason ?? '不允许的操作' },
        { status: 409 }
      );
    }

    db[idx] = { ...o, status: 'cancelled', updatedAt: new Date().toISOString() };
    __setDB(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[cancel.route] unexpected error:', err);
    return NextResponse.json({ error: 'InternalError', message: '服务器内部错误' }, { status: 500 });
  }
}
