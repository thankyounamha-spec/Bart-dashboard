import { useEffect, useRef } from 'react';

/**
 * Custom hook that polls a function at a given interval.
 * Automatically cleans up on unmount.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
) {
  const savedCallback = useRef(callback);

  // Keep the latest callback in a ref
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
