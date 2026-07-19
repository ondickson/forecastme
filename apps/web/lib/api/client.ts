import { API_BASE_URL } from '@/lib/api/config';
import { ApiError, type ApiErrorPayload } from '@/lib/api/errors';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  accessToken?: string;
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function normalizeErrorMessage(payload: ApiErrorPayload | undefined, fallback: string): string {
  if (!payload?.message) {
    return fallback;
  }

  return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('Unable to connect to the ForecastMe API.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('ForecastMe received an invalid response from the API.', {
        status: 502,
        code: 'INVALID_API_RESPONSE',
      });
    }
  }

  let payload: ApiErrorPayload | undefined;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = undefined;
  }

  throw new ApiError(
    normalizeErrorMessage(payload, `Request failed with status ${response.status}`),
    {
      status: response.status,
      code: payload?.error,
      requestId: payload?.requestId ?? response.headers.get('x-request-id') ?? undefined,
      payload,
    },
  );
}
