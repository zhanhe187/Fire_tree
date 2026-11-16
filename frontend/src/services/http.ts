import { getAuthToken } from '../features/auth/services/authState';
import { friendlyApiError, translateBackendMessage, genericBackendErrorLabels } from './apiErrors';

async function responseError(response: Response, path: string) {
  let backendMessage = '';
  const contentType = response.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
      const body = await response.json() as Record<string, unknown>;
      const bodyMessage = String(body.message || body.detail || '').trim();
      const errorLabel = String(body.error || '').trim();
      backendMessage = bodyMessage || (genericBackendErrorLabels.has(errorLabel) ? '' : errorLabel);
    } else {
      backendMessage = await response.text();
    }
  } catch {
    backendMessage = '';
  }
  if (!backendMessage && response.status === 400 && path.startsWith('/api/community/')) {
    return new Error('内容包含敏感词，请修改后再发布。');
  }
  // token 失效/缺失统一提示重新登录，避免把 "Invalid bearer token" 这类英文抛给用户。
  // 登录接口本身的 401 表示账号密码错误，走下面的正常翻译。
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    return new Error('登录状态已失效，请重新登录。');
  }
  return new Error(translateBackendMessage(backendMessage) || friendlyApiError(path, response.status));
}

export async function request<T>(path: string): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw await responseError(response, path);
  }

  return response.json() as Promise<T>;
}

export async function send<T>(path: string, method: string, body?: unknown, options: { headers?: Record<string, string> } = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw await responseError(response, path);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function sendForm<T>(path: string, body: FormData): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  if (!response.ok) {
    throw await responseError(response, path);
  }

  return response.json() as Promise<T>;
}
