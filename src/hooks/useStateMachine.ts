import { useCallback, useMemo, useState } from 'react';

/**
 * 状态机转移配置
 * 定义单个转移的规则和行为
 *
 * @template S - 状态类型
 * @template C - 上下文类型
 * @template E - 事件类型
 */
export interface MachineTransition<S, C, E> {
  /** 转移的目标状态 */
  target: S;
  /** 可选的守卫函数：验证权限/规则，返回 true 允许转移或返回拒绝原因 */
  guard?: (ctx: C) => true | { ok: false; reason: string };
  /** 可选的副作用处理函数：转移前执行，如 API 调用 */
  effect?: (ctx: C, event: E) => Promise<void>;
}

/**
 * useStateMachine hook 的配置参数
 *
 * @template S - 状态类型，必须是字符串类型
 * @template C - 上下文类型，保持业务数据
 * @template E - 事件类型，必须有 type 字段
 */
interface UseStateMachineParams<S extends string, C, E extends { type: string }> {
  /** 初始状态 */
  initialState: S;
  /** 状态机上下文，包含权限、业务属性等信息 */
  ctx: C;
  /** 转移表：从状态到事件处理的映射 Record<状态, Record<事件类型, 转移配置>> */
  transitions: Record<S, Record<E['type'], MachineTransition<S, C, E>>>;
}

/**
 * React 状态机 Hook
 *
 * 实现了一个通用的有限状态机，支持：
 * - 状态管理（state, setState）
 * - 事件分发（dispatch）
 * - 权限守卫（guard）
 * - 副作用处理（effect）
 * - 可用操作列表（actions）
 * - 异步操作跟踪（pending, error）
 *
 * 执行流程：
 * 1. 调用 dispatch(event)
 * 2. 查找转移规则
 * 3. 执行守卫检查（如果有）
 * 4. 执行副作用（如果有）
 * 5. 更新状态
 *
 * @template S - 状态类型
 * @template C - 上下文类型
 * @template E - 事件类型
 * @param params - 配置参数
 * @returns 返回状态机实例，包含状态、操作列表、分发器等
 */
export function useStateMachine<S extends string, C, E extends { type: string }>({
  initialState,
  ctx,
  transitions,
}: UseStateMachineParams<S, C, E>) {
  const [state, setState] = useState<S>(initialState);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 计算当前状态下的可用操作列表
   * 遍历该状态的所有转移，检查每个转移的守卫
   *
   * @returns 可用操作列表：type, enabled, reason
   */
  const actions = useMemo(() => {
    const map = transitions[state] || {};
    return Object.keys(map).map((type) => {
      const t = map[type as E['type']];
      const guardResult = t.guard ? t.guard(ctx) : true;

      return {
        type,
        enabled: guardResult === true,
        reason: guardResult === true ? undefined : guardResult.reason,
      };
    });
  }, [state, transitions, ctx]);

  /**
   * 分发事件并执行状态转移
   *
   * 转移过程：
   * 1. 查找转移规则，不存在则抛出 INVALID_TRANSITION
   * 2. 执行守卫检查，失败则抛出错误
   * 3. 设置 pending=true，清空错误
   * 4. 执行副作用（如有）
   * 5. 更新状态
   * 6. 返回新状态
   *
   * @param event - 要分发的事件
   * @returns Promise，解决后返回新状态
   * @throws 如果转移不存在、守卫失败或 effect 执行失败
   */
  const dispatch = useCallback(
    async (event: E) => {
      const t = transitions[state]?.[event.type as E['type']];
      if (!t) throw new Error('INVALID_TRANSITION');

      const guardResult = t.guard ? t.guard(ctx) : true;
      if (guardResult !== true) {
        throw new Error(guardResult.reason);
      }

      setPending(true);
      setError(null);

      try {
        if (t.effect) {
          await t.effect(ctx, event);
        }
        setState(t.target);
        return t.target;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
        setError(message);
        throw error;
      } finally {
        setPending(false);
      }
    },
    [state, transitions, ctx]
  );

  return {
    /** 当前状态 */
    state,
    /** 直接设置状态（一般不推荐使用，仅用于特殊场景） */
    setState,
    /** 当前状态下的可用操作列表 */
    actions,
    /** 事件分发函数 */
    dispatch,
    /** 是否正在执行转移（异步操作中） */
    pending,
    /** 最后一次操作的错误信息，成功时为 null */
    error,
  };
}
