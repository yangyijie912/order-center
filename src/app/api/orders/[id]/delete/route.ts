import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../../route';
import { canDelete } from '@/features/orders/domain/rules';

// 删除订单接口（仅允许在特定状态下删除）
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params;
    const id = decodeURIComponent(params.id);
    const db = __getDB();
    const idx = db.findIndex((o) => o.id === id);
    if (idx === -1) return NextResponse.json({ error: 'NotFound', message: '订单不存在' }, { status: 404 });

    const o = db[idx];
    const allowed = canDelete(o);
    if (allowed !== true) {
      return NextResponse.json({ error: 'NotAllowed', message: allowed.reason }, { status: 409 });
    }

    const next = db.slice();
    next.splice(idx, 1);
    __setDB(next);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[delete.route] unexpected error:', err);
    return NextResponse.json({ error: 'InternalError', message: '服务器内部错误' }, { status: 500 });
  }
}
