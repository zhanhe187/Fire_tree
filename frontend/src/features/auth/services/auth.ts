import { request, send, sendForm } from '../../../services/http';

export interface AuthUser {
  id: number;
  username: string;
  nickname: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  userType: 'SUPER_ADMIN' | 'INHERITOR' | 'NORMAL';
  status: number;
  lastLoginAt?: string;
}

export interface AuthRole {
  id: number;
  roleCode: string;
  roleName: string;
  description?: string;
}

export interface AuthPermission {
  id: number;
  permissionCode: string;
  permissionName: string;
  permissionType: 'MENU' | 'BUTTON' | 'API';
  routePath?: string;
  icon?: string;
  sortOrder?: number;
}

export interface AuthPayload {
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  user: AuthUser;
  roles: AuthRole[];
  permissions: AuthPermission[];
  menus: AuthPermission[];
}

export interface CaptchaResponse {
  captchaId: string;
  captchaImage: string;
  expiresIn: number;
  debugCode?: string;
}

export interface EmailCodeResponse {
  email: string;
  purpose: 'REGISTER' | 'RESET_PASSWORD';
  expiresIn: number;
  debugCode?: string;
}

export function login(payload: { username: string; password: string; captchaId: string; captchaCode: string }) {
  return send<AuthPayload>('/api/auth/login', 'POST', payload);
}

export function register(payload: {
  username: string;
  password: string;
  nickname?: string;
  userType?: 'SUPER_ADMIN' | 'INHERITOR' | 'NORMAL';
  email: string;
  emailCode: string;
  phone?: string;
}) {
  return send<AuthPayload>('/api/auth/register', 'POST', payload);
}

export function fetchCaptcha() {
  return request<CaptchaResponse>('/api/auth/captcha');
}

export function sendAuthEmailCode(payload: {
  email: string;
  purpose: 'REGISTER' | 'RESET_PASSWORD';
  captchaId: string;
  captchaCode: string;
}) {
  return send<EmailCodeResponse>('/api/auth/email-code', 'POST', payload);
}

export function resetPasswordByEmail(payload: { email: string; emailCode: string; newPassword: string }) {
  return send<AuthPayload>('/api/auth/password/reset', 'POST', payload);
}

export function fetchCurrentUser(token: string) {
  return fetch('/api/auth/me', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`/api/auth/me returned ${response.status}`);
    }
    return response.json() as Promise<AuthPayload>;
  });
}

export function updateCurrentUserProfile(payload: {
  nickname?: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
}) {
  return send<AuthPayload>('/api/auth/me/profile', 'PUT', payload);
}

export function uploadCurrentUserAvatar(file: File) {
  const form = new FormData();
  form.set('file', file);
  return sendForm<AuthPayload & { avatarUrl?: string }>('/api/auth/me/avatar', form);
}

export function changeCurrentUserPassword(payload: { oldPassword: string; newPassword: string }) {
  return send<AuthPayload>('/api/auth/me/password', 'PUT', payload);
}

