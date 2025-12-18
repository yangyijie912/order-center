import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../../route';

// 发货接口：仅允许 paid -> shipped，支持保存运单号
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const id = decodeURIComponent(params.id);
  const db = __getDB();
  const idx = db.findIndex((o) => o.id === id);
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const o = db[idx];
  if (o.status !== 'paid') {
    return NextResponse.json({ message: 'Only paid orders can be shipped' }, { status: 400 });
  }

  let trackingNo: string | undefined;
  try {
    const parsed: unknown = await req.json();
    if (parsed && typeof parsed === 'object' && 'trackingNo' in parsed) {
      const p = parsed as { trackingNo?: unknown };
      if (typeof p.trackingNo === 'string') trackingNo = p.trackingNo;
    }
  } catch {
    // ignore parse errors
  }

  db[idx] = { ...o, status: 'shipped', ...(trackingNo ? { trackingNo } : {}), updatedAt: new Date().toISOString() };
  __setDB(db);
  return NextResponse.json({ success: true });
}
