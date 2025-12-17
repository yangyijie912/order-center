import { useCallback, useRef } from 'react';

/**
 * useThrottledCallback
 * - 返回一个节流后的回调函数和取消函数
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(fn: T, wait = 300) {
  const last = useRef<number>(0);
  const timer = useRef<number | undefined>(undefined);

  const cancel = useCallback(() => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = wait - (now - last.current);
      if (remaining <= 0) {
        last.current = now;

        fn(...args);
      } else {
        cancel();
        timer.current = window.setTimeout(() => {
          last.current = Date.now();

          fn(...args);
        }, remaining);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, wait]
  );

  return [throttled, cancel] as const;
}

export default useThrottledCallback;
