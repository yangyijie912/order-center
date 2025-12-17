import { useEffect, useState } from 'react';

/**
 * useDebouncedValue
 * - 返回 value 的防抖版本，当 value 在 delay 毫秒内不再变化时更新返回值
 */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
