import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../../route';
import { canTransition } from '@/features/orders/domain/stateMachine';
import { simulatePayment } from '@/features/orders/services/paymentSimulator';

// 支付接口：通过状态机校验并执行从 pending -> paid 的转移
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const id = decodeURIComponent(params.id);
    const db = __getDB();
    const idx = db.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'NotFound', message: '订单不存在' }, { status: 404 });

    const o = db[idx];

    const guard = canTransition(o.status, 'PAY', {
      order: { id: o.id, userId: o.userId, amount: o.amount, status: o.status },
      role: 'operator',
    });
    if (guard !== true) {
      return NextResponse.json(
        { error: 'InvalidTransition', message: guard.reason ?? '不允许的操作' },
        { status: 409 }
      );
    }

    // 使用模拟器决定支付结果（演示用）
    const result = simulatePayment(id);
    if (result === 'paid') {
      db[idx] = { ...o, status: 'paid', updatedAt: new Date().toISOString() };
      __setDB(db);
      return NextResponse.json({ success: true, message: '支付成功' });
    }
    if (result === 'payment_failed') {
      db[idx] = { ...o, status: 'payment_failed', updatedAt: new Date().toISOString() };
      __setDB(db);
      // 返回 402 表示支付失败（非 2xx），方便前端基于 HTTP 状态判断失败
      return NextResponse.json({ success: false, error: 'payment_failed', message: '支付失败' }, { status: 402 });
    }
    // result === 'paying'：支付处理中，返回 202 表示异步处理中
    db[idx] = { ...o, status: 'paying', updatedAt: new Date().toISOString() };
    __setDB(db);
    return NextResponse.json({ success: false, status: 'paying', message: '支付处理中，请稍后刷新' }, { status: 202 });
  } catch (err) {
    console.error('[pay.route] unexpected error:', err);
    return NextResponse.json({ error: 'InternalError', message: '服务器内部错误' }, { status: 500 });
  }
}
