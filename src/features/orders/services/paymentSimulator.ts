/**
 * 支付模拟器（仅用于演示/本地开发）
 *
 * 说明：本模块保持“纯模拟”——只负责给出 outcome，不负责写库/异步结算。
 * 订单状态写入由 pay route 统一负责；paying 的最终结算由后端在读取列表/详情时兜底结算。
 */

export type PayOutcome = 'paid' | 'payment_failed' | 'paying';

export type SimulatorConfig = {
  // 概率（0-1），若不传则默认均等 1/3
  successProb?: number;
  payingProb?: number;
  failProb?: number;
};

/**
 * 随机选择结果
 */
function pickOutcome(cfg: Required<SimulatorConfig>, seed: number): PayOutcome {
  const r = (Math.random() + seed) % 1;
  if (r < cfg.successProb) return 'paid';
  if (r < cfg.successProb + cfg.payingProb) return 'paying';
  return 'payment_failed';
}

function hashToUnit(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return (hash % 10_000) / 10_000;
}

/**
 * 模拟支付流程：根据概率返回即时 outcome（'paid'|'payment_failed'|'paying'）
 * - 无副作用：不写库、不启动定时器
 */
export function simulatePayment(orderId: string, opts?: SimulatorConfig): PayOutcome {
  const cfg: Required<SimulatorConfig> = {
    successProb: opts?.successProb ?? 1 / 3,
    payingProb: opts?.payingProb ?? 1 / 3,
    failProb: opts?.failProb ?? 1 / 3,
  };

  // 规范化：保证和为 1
  const total = cfg.successProb + cfg.payingProb + cfg.failProb;
  cfg.successProb /= total;
  cfg.payingProb /= total;
  cfg.failProb /= total;

  const seed = hashToUnit(`${orderId}|${Date.now()}`);
  return pickOutcome(cfg, seed);
}

const paymentSimulator = { simulatePayment };
export default paymentSimulator;
