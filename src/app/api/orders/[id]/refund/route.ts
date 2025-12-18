import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../../route';

// 退款接口：仅允许 paid -> refunded
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const id = decodeURIComponent(params.id);
  const db = __getDB();
  const idx = db.findIndex((o) => o.id === id);
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const o = db[idx];
  if (o.status !== 'paid') {
    return NextResponse.json({ message: 'Only paid orders can be refunded' }, { status: 400 });
  }

  db[idx] = { ...o, status: 'refunded', updatedAt: new Date().toISOString() };
  __setDB(db);
  return NextResponse.json({ success: true });
}
