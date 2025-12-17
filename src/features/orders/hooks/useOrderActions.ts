'use client';

import { useState } from 'react';
import { cancelOrder, deleteOrder } from '../services/ordersApi';

export function useOrderActions() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function onCancel(id: string) {
    setPendingId(id);
    try {
      await cancelOrder(id);
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, message: e?.message || 'Cancel failed' };
    } finally {
      setPendingId(null);
    }
  }

  async function onDelete(id: string) {
    setPendingId(id);
    try {
      await deleteOrder(id);
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, message: e?.message || 'Delete failed' };
    } finally {
      setPendingId(null);
    }
  }

  return { pendingId, onCancel, onDelete };
}
