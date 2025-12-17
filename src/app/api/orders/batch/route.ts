import { NextResponse, type NextRequest } from 'next/server';
import { __getDB, __setDB } from '../route';

type BatchAction = { action: 'cancel' | 'delete'; ids: string[] };

export async function POST(req: NextRequest) {
  const body = (await req.json()) as BatchAction;
  const db = __getDB();

  const successIds: string[] = [];
  const skippedIds: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  if (body.action === 'cancel') {
    const next = db.slice();
    for (const id of body.ids) {
      const idx = next.findIndex((o) => o.id === id);
      if (idx === -1) {
        skippedIds.push(id);
        continue;
      }
      const o = next[idx];
      if (o.status !== 'pending') {
        skippedIds.push(id);
        continue;
      }
      next[idx] = { ...o, status: 'cancelled', updatedAt: new Date().toISOString() };
      successIds.push(id);
    }
    __setDB(next);
    return NextResponse.json({ successIds, skippedIds, failed });
  }

  if (body.action === 'delete') {
    // only allowed for cancelled/completed/refunded
    const next = db.slice();
    for (const id of body.ids) {
      const idx = next.findIndex((o) => o.id === id);
      if (idx === -1) {
        skippedIds.push(id);
        continue;
      }
      const o = next[idx];
      if (!['cancelled', 'completed', 'refunded'].includes(o.status)) {
        skippedIds.push(id);
        continue;
      }
      next.splice(idx, 1);
      successIds.push(id);
    }
    __setDB(next);
    return NextResponse.json({ successIds, skippedIds, failed });
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
}
