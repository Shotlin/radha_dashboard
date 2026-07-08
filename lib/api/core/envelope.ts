/**
 * lib/api/core/envelope.ts — unwraps the RADHA backend's global response
 * envelope.
 *
 * `radha_backend`'s `ResponseInterceptor` (applied via `APP_INTERCEPTOR`,
 * `src/common/common.module.ts`) wraps EVERY response as
 * `{ success: true, data: <payload>, meta: {...} }` on success, or
 * `{ success: false, error: { code, message, details? }, meta: {...} }`
 * on failure. Every dashboard route that talks to the backend must read
 * one level deeper than the raw JSON body — this is the one place that
 * logic lives so a new route can't reintroduce the bug by hand-rolling
 * its own `res.json()` cast.
 *
 * Discovered live during Phase 11 (dashboard_deploy): the dashboard had
 * never actually been exercised against the real backend (only
 * `DEMO_MODE`), so every direct-fetch site cast the raw body straight to
 * a flat shape and would have silently received `undefined` for every
 * field the moment it left demo mode.
 */

interface BackendEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string; details?: unknown };
  meta?: unknown;
}

/**
 * Reads a backend `Response` body and returns the unwrapped `data`
 * payload. Defensive: if the body doesn't look like the envelope shape
 * (no `success` key), returns the raw parsed body as-is so a non-backend
 * response (e.g. a raw error page from nginx/Cloudflare) doesn't throw
 * here — the caller's own `res.ok`/status handling is what should have
 * already gated this.
 */
export async function parseBackendJson<T>(res: Response): Promise<T> {
  const body: unknown = await res.json();
  if (body && typeof body === 'object' && 'success' in body) {
    return (body as BackendEnvelope<T>).data as T;
  }
  return body as T;
}

/**
 * Extracts `{code, message, details}` from a backend error body,
 * defaulting gracefully when the body isn't the envelope shape (a raw
 * proxy/gateway error, or an already-flat legacy shape).
 */
export function parseBackendError(body: unknown): {
  code?: string;
  message?: string;
  details?: unknown;
} {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (obj.error && typeof obj.error === 'object') {
      const err = obj.error as Record<string, unknown>;
      return {
        code: typeof err.code === 'string' ? err.code : undefined,
        message: typeof err.message === 'string' ? err.message : undefined,
        details: err.details,
      };
    }
    // Legacy/flat fallback (e.g. a non-enveloped 4xx from something else
    // in front of the backend).
    return {
      code: typeof obj.code === 'string' ? obj.code : undefined,
      message: typeof obj.message === 'string' ? obj.message : undefined,
    };
  }
  return {};
}
