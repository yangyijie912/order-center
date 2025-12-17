import { useCallback, useRef } from 'react';

/**
 * useDebouncedCallback
 * - 返回一个防抖后的回调函数和取消函数
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(fn: T, delay = 300) {
  const timer = useRef<number | undefined>(undefined);

  const cancel = useCallback(() => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      timer.current = window.setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay]
  );

  return [debounced, cancel] as const;
}

export default useDebouncedCallback;
