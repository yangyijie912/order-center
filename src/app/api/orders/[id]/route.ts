import { NextResponse, type NextRequest } from 'next/server';
import { __getDB } from '../route';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const id = decodeURIComponent(params.id);
  const db = __getDB();
  const o = db.find((it) => it.id === id);
  if (!o) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(o);
}
