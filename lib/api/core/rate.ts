/**
 * lib/api/core/rate.ts — debounce, throttle, and 429 back-off helpers.
 */

/**
 * debounce — delays fn invocation until wait ms after the last call.
 * Use for search inputs, filter changes, etc.
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  }) as T;
}

/**
 * throttle — ensures fn is called at most once per wait ms.
 * Use for polling, scroll handlers, etc.
 */
export function throttle<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let last = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  }) as T;
}

/**
 * exponentialBackoff — wait 2^attempt * baseMs (capped at maxMs).
 * Use after a 429 response.
 */
export function exponentialBackoffMs(attempt: number, baseMs = 500, maxMs = 16000): number {
  return Math.min(Math.pow(2, attempt) * baseMs, maxMs);
}

/** Sleep for ms milliseconds. Use in async retry loops. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
