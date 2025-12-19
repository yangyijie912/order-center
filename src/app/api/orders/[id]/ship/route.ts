import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../../route';
import { canTransition } from '@/features/orders/domain/stateMachine';
import { getRoleFromRequest } from '@/features/auth/server';

// 发货接口：使用状态机校验是否允许从当前状态转为 `shipped`，并支持保存运单号
// 异常处理：
// - JSON 解析错误返回 400
// - 不允许的状态返回 409（冲突）并带用户友好原因
// - 未找到订单返回 404
// - 其他异常返回 500
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const id = decodeURIComponent(params.id);
    const db = __getDB();
    const idx = db.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'NotFound', message: '订单不存在' }, { status: 404 });

    const o = db[idx];

    const role = getRoleFromRequest(req) ?? 'viewer';

    // 使用状态机统一校验是否允许发货（兼容各种异常/回退状态）
    const guard = canTransition(o.status, 'SHIP', {
      order: { id: o.id, userId: o.userId, amount: o.amount, status: o.status },
      role,
    });
    if (guard !== true) {
      return NextResponse.json(
        { error: 'InvalidTransition', message: guard.reason ?? '不允许的操作' },
        { status: 409 }
      );
    }

    // 解析请求体，若解析失败则视为 400（非法请求）
    let trackingNo: string | undefined;
    try {
      const parsed: unknown = await req.json();
      if (parsed && typeof parsed === 'object' && 'trackingNo' in parsed) {
        const p = parsed as { trackingNo?: unknown };
        if (typeof p.trackingNo === 'string') trackingNo = p.trackingNo;
      }
    } catch {
      return NextResponse.json({ error: 'InvalidRequest', message: '请求体不是有效的 JSON' }, { status: 400 });
    }

    // 更新订单状态及可选运单号，更新 updatedAt
    db[idx] = { ...o, status: 'shipped', ...(trackingNo ? { trackingNo } : {}), updatedAt: new Date().toISOString() };
    __setDB(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    // 未预期的错误，记录日志并返回 500
    console.error('[ship.route] unexpected error:', err);
    return NextResponse.json({ error: 'InternalError', message: '服务器内部错误' }, { status: 500 });
  }
}
