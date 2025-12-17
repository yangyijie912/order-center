import { NextResponse } from 'next/server';
import { __getDB, __setDB } from '../../route';

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  const id = decodeURIComponent(ctx.params.id);
  const db = __getDB();
  const idx = db.findIndex(o => o.id === id);
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const o = db[idx];
  if (o.status !== 'pending') {
    return NextResponse.json({ message: 'Only pending orders can be cancelled' }, { status: 400 });
  }

  db[idx] = { ...o, status: 'cancelled', updatedAt: new Date().toISOString() };
  __setDB(db);
  return NextResponse.json({ success: true });
}
