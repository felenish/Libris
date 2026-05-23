import type { ApiError } from './types';

export class LibrisApiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'LibrisApiError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let code = `HTTP_${response.status}`;
    let message = response.statusText;
    try {
      const body = (await response.json()) as { error: ApiError };
      code = body.error.code;
      message = body.error.message;
    } catch { }
    throw new LibrisApiError(code, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
