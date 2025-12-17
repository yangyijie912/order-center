import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../../route';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const id = decodeURIComponent(params.id);
  const db = __getDB();
  const idx = db.findIndex((o) => o.id === id);
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const o = db[idx];
  if (!['cancelled', 'completed', 'refunded'].includes(o.status)) {
    return NextResponse.json({ message: 'Only cancelled/completed/refunded can be deleted' }, { status: 400 });
  }

  const next = db.slice();
  next.splice(idx, 1);
  __setDB(next);
  return NextResponse.json({ success: true });
}
