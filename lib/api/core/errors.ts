/**
 * lib/api/core/errors.ts — typed API error classes and UI mapping.
 */

export interface ApiErrorFields {
  [field: string]: string;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: ApiErrorFields;
  status: number;
  requestId?: string;
}

/** Base API error — thrown by apiFetch on non-2xx responses. */
export class ApiRequestError extends Error {
  readonly code: string;
  readonly fields?: ApiErrorFields;
  readonly status: number;
  readonly requestId?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.fields = error.fields;
    this.status = error.status;
    this.requestId = error.requestId;
  }
}

/** 401 — session expired and refresh failed. */
export class UnauthorizedError extends ApiRequestError {
  constructor(requestId?: string) {
    super({ code: 'UNAUTHORIZED', message: 'Session expired. Please sign in again.', status: 401, requestId });
    this.name = 'UnauthorizedError';
  }
}

/** 403 — authenticated but not allowed. */
export class ForbiddenError extends ApiRequestError {
  constructor(message = 'You do not have permission to perform this action.', requestId?: string) {
    super({ code: 'FORBIDDEN', message, status: 403, requestId });
    this.name = 'ForbiddenError';
  }
}

/** 404 — resource not found. */
export class NotFoundError extends ApiRequestError {
  constructor(message = 'Resource not found.', requestId?: string) {
    super({ code: 'NOT_FOUND', message, status: 404, requestId });
    this.name = 'NotFoundError';
  }
}

/** 429 — rate limited. */
export class RateLimitError extends ApiRequestError {
  readonly retryAfterMs: number;
  constructor(retryAfterMs = 5000, requestId?: string) {
    super({ code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.', status: 429, requestId });
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/** Validation error — Zod schema rejected the response payload. */
export class ResponseValidationError extends Error {
  readonly issues: unknown;
  constructor(issues: unknown) {
    super('API response did not match expected schema');
    this.name = 'ResponseValidationError';
    this.issues = issues;
  }
}

/** 🆕 Proposed backend endpoint — not yet implemented in production. */
export class NotImplementedBackendError extends Error {
  constructor(endpoint: string) {
    super(`Endpoint "${endpoint}" is a proposed feature not yet available in the backend. Build the backend module first.`);
    this.name = 'NotImplementedBackendError';
  }
}

/* ── UI error mapping ─────────────────────────────────────────────────────── */

export type UiErrorPlacement = 'field' | 'inline' | 'toast';

export interface UiError {
  message: string;
  placement: UiErrorPlacement;
  fields?: ApiErrorFields;
}

/**
 * toUiError — maps an ApiRequestError to placement strategy:
 * - 422 with field errors → 'field' (show inline below each input)
 * - 4xx (client errors) → 'inline' (show in the form/card)
 * - 5xx (server errors) → 'toast' (non-blocking notification)
 */
export function toUiError(err: unknown): UiError {
  if (err instanceof ApiRequestError) {
    if (err.status === 422 && err.fields) {
      return { message: err.message, placement: 'field', fields: err.fields };
    }
    if (err.status >= 400 && err.status < 500) {
      return { message: err.message, placement: 'inline' };
    }
    return { message: err.message || 'Something went wrong', placement: 'toast' };
  }
  return { message: 'An unexpected error occurred', placement: 'toast' };
}
