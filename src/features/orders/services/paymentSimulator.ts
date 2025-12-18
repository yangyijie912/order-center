/**
 * 支付模拟器（仅用于演示/本地开发）
 *
 * 目的：在页面上可视化支付流程的多种异常路径（成功/失败/支付中）
 * 要求：逻辑独立，可通过参数调整概率与延迟，便于后续替换为真实的降级实现或后端模拟服务
 */
import { __getDB, __setDB } from '@/app/api/orders/route';

export type PayOutcome = 'paid' | 'payment_failed' | 'paying';

export type SimulatorConfig = {
  // 概率（0-1），若不传则默认均等 1/3
  successProb?: number;
  payingProb?: number;
  failProb?: number;
  // 当结果为 paying 时，后台自动在该延迟后执行最终结果（ms）
  resolveDelayMs?: number;
};

/**
 * 随机选择结果
 */
function pickOutcome(cfg: Required<SimulatorConfig>): PayOutcome {
  const r = Math.random();
  if (r < cfg.successProb) return 'paid';
  if (r < cfg.successProb + cfg.payingProb) return 'paying';
  return 'payment_failed';
}

/**
 * 模拟支付流程：基于概率直接把订单置为 paid/payment_failed，或先置为 paying 并在延迟后决议
 * - 返回即时结果（'paid'|'payment_failed'|'paying'）
 * - 若返回 'paying'，模块会在后台在 resolveDelayMs 后把订单更新为 paid 或 payment_failed
 */
export function simulatePayment(orderId: string, opts?: SimulatorConfig): PayOutcome {
  const cfg: Required<SimulatorConfig> = {
    successProb: opts?.successProb ?? 1 / 3,
    payingProb: opts?.payingProb ?? 1 / 3,
    failProb: opts?.failProb ?? 1 / 3,
    resolveDelayMs: opts?.resolveDelayMs ?? 5000,
  };

  // 规范化：保证和为 1
  const total = cfg.successProb + cfg.payingProb + cfg.failProb;
  cfg.successProb /= total;
  cfg.payingProb /= total;
  cfg.failProb /= total;

  const outcome = pickOutcome(cfg);

  const db = __getDB();
  const idx = db.findIndex((o) => o.id === orderId);
  if (idx === -1) return 'payment_failed';

  const now = new Date().toISOString();

  if (outcome === 'paid') {
    db[idx] = { ...db[idx], status: 'paid', updatedAt: now };
    __setDB(db);
    return 'paid';
  }

  if (outcome === 'payment_failed') {
    db[idx] = { ...db[idx], status: 'payment_failed', updatedAt: now };
    __setDB(db);
    return 'payment_failed';
  }

  // outcome === 'paying'
  db[idx] = { ...db[idx], status: 'paying', updatedAt: now };
  __setDB(db);

  // 在后台异步决议支付结果：按 success/fail 比例随机决定
  setTimeout(() => {
    const db2 = __getDB();
    const i2 = db2.findIndex((o) => o.id === orderId);
    if (i2 === -1) return;

    // 最终概率：成功概率与失败概率按原始比例再随机
    const r2 = Math.random();
    // 这里把成功与失败对半分配（可改为 cfg.successProb/(cfg.successProb+cfg.failProb)）
    const successChance = cfg.successProb / (cfg.successProb + cfg.failProb);
    const finalStatus: PayOutcome = r2 < successChance ? 'paid' : 'payment_failed';
    const now2 = new Date().toISOString();
    db2[i2] = { ...db2[i2], status: finalStatus === 'paid' ? 'paid' : 'payment_failed', updatedAt: now2 };
    __setDB(db2);
    console.log(`[paymentSimulator] order ${orderId} resolved to ${finalStatus}`);
  }, cfg.resolveDelayMs);

  return 'paying';
}

const paymentSimulator = { simulatePayment };
export default paymentSimulator;
