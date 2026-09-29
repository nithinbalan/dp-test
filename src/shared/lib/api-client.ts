/**
 * Typed client API fetcher.
 * Normalizes HTTP responses and parses error payloads into ApiError.
 * See docs/TANSTACK_QUERY.md §3 and docs/ERROR_HANDLING.md §6.
 */

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function parseErrorPayload(body: unknown, status: number): ApiError {
  let errorCode = 'INTERNAL';
  let errorMessage = 'An unexpected error occurred.';

  if (body && typeof body === 'object' && 'error' in body) {
    const errorObj = (body as { error: { code?: string; message?: string } }).error;
    if (errorObj.code) errorCode = errorObj.code;
    if (errorObj.message) errorMessage = errorObj.message;
  }

  return new ApiError(errorCode, errorMessage, status);
}

export async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  // FormData sets its own multipart boundary — the browser handles that only when
  // Content-Type is left unset. Only stamp JSON on a plain object/string body.
  if (!headers.has('Content-Type') && options?.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = Boolean(contentType?.includes('application/json'));

  const body: unknown = isJson ? await response.json() : undefined;

  if (!response.ok) {
    throw parseErrorPayload(body, response.status);
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data;
  }

  return body as T;
}
