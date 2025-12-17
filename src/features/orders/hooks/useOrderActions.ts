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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e ?? 'Cancel failed');
      return { ok: false as const, message };
    } finally {
      setPendingId(null);
    }
  }

  async function onDelete(id: string) {
    setPendingId(id);
    try {
      await deleteOrder(id);
      return { ok: true as const };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e ?? 'Delete failed');
      return { ok: false as const, message };
    } finally {
      setPendingId(null);
    }
  }

  return { pendingId, onCancel, onDelete };
}
