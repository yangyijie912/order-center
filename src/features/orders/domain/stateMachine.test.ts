import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/ordersApi', () => {
  return {
    cancelOrder: vi.fn(async () => ({ success: true })),
    payOrder: vi.fn(async () => ({ next: 'paid' as const, message: undefined })),
    refundOrder: vi.fn(async () => ({ success: true })),
    shipOrder: vi.fn(async () => ({ success: true })),
  };
});

type StateMachineModule = typeof import('./stateMachine');

describe('order stateMachine', () => {
  let sm: StateMachineModule;

  beforeEach(async () => {
    vi.resetModules();
    sm = await import('./stateMachine');
  });

  it('canTransition: rejects unsupported transitions with a reason', () => {
    const ctx = {
      order: { id: 'o1', userId: 'u1', amount: 10, status: 'paid' as const },
      role: 'admin' as const,
      isRefundable: true,
    };

    const res = sm.canTransition('paid', 'PAY', ctx);
    expect(res).not.toBe(true);
    if (res !== true) expect(res.reason).toBeTruthy();
  });

  it('canTransition: guard blocks SHIP for viewer', () => {
    const ctx = {
      order: { id: 'o1', userId: 'u1', amount: 10, status: 'paid' as const },
      role: 'viewer' as const,
      isRefundable: true,
    };

    const res = sm.canTransition('paid', 'SHIP', ctx);
    expect(res).not.toBe(true);
    if (res !== true) expect(res.reason).toContain('无权限');
  });

  it('transition: uses effect-returned next (PAY)', async () => {
    const api = await import('../services/ordersApi');
    (api.payOrder as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      next: 'payment_failed',
      message: 'card declined',
    });

    const ctx = {
      order: { id: 'o2', userId: 'u2', amount: 99, status: 'pending' as const },
      role: 'admin' as const,
      isRefundable: false,
    };

    const res = await sm.transition('pending', { type: 'PAY' }, ctx);
    expect(res.next).toBe('payment_failed');
    expect(res.message).toBe('card declined');
    expect(api.payOrder).toHaveBeenCalledWith('o2', { role: 'admin' });
  });

  it('transition: falls back to target when effect returns void (CANCEL)', async () => {
    const api = await import('../services/ordersApi');

    const ctx = {
      order: { id: 'o3', userId: 'u3', amount: 10, status: 'pending' as const },
      role: 'admin' as const,
      isRefundable: false,
    };

    const res = await sm.transition('pending', { type: 'CANCEL' }, ctx);
    expect(res.next).toBe('cancelled');
    expect(api.cancelOrder).toHaveBeenCalledWith('o3', { role: 'admin' });
  });

  it('transition: throws INVALID_TRANSITION when not defined', async () => {
    const ctx = {
      order: { id: 'o4', userId: 'u4', amount: 10, status: 'completed' as const },
      role: 'admin' as const,
      isRefundable: false,
    };

    await expect(sm.transition('completed', { type: 'PAY' }, ctx)).rejects.toThrow('INVALID_TRANSITION');
  });

  it('transition table sanity: event keys are known OrderEvent types', () => {
    const allowed = new Set(['PAY', 'CANCEL', 'SHIP', 'CONFIRM_RECEIPT', 'REFUND']);

    for (const perState of Object.values(sm.orderTransitions)) {
      for (const key of Object.keys(perState ?? {})) {
        expect(allowed.has(key)).toBe(true);
      }
    }
  });
});
