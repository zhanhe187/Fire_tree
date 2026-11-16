import { request, send, sendForm } from '../../../services/http';

export interface AdminUserItem {
  id: number;
  username: string;
  nickname: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  userType: 'SUPER_ADMIN' | 'INHERITOR' | 'NORMAL';
  status: number;
  roleCodes?: string;
  roleNames?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserListResponse {
  page: number;
  size: number;
  total: number;
  items: AdminUserItem[];
}

export interface AdminUserUpdatePayload {
  nickname?: string;
  realName?: string | null;
  phone?: string | null;
  email?: string | null;
  userType?: 'SUPER_ADMIN' | 'INHERITOR' | 'NORMAL';
  status?: number;
}

export interface AdminUserCreatePayload {
  username: string;
  password: string;
  nickname?: string;
  userType?: 'SUPER_ADMIN' | 'INHERITOR' | 'NORMAL';
  phone?: string;
  email?: string;
}

export interface AdminUserPasswordPayload {
  newPassword: string;
}

export function fetchAdminUsers(params: {
  keyword?: string;
  userType?: string;
  status?: number | string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.userType) search.set('userType', params.userType);
  if (params.status !== undefined && params.status !== '') search.set('status', String(params.status));
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<AdminUserListResponse>(`/api/admin/users?${search.toString()}`);
}

export function updateAdminUser(id: number, payload: AdminUserUpdatePayload) {
  return send<AdminUserItem>(`/api/admin/users/${id}`, 'PUT', payload);
}

export function createAdminUser(payload: AdminUserCreatePayload) {
  return send<AdminUserItem>('/api/admin/users', 'POST', payload);
}

export function resetAdminUserPassword(id: number, payload: AdminUserPasswordPayload) {
  return send<AdminUserItem>(`/api/admin/users/${id}/password`, 'PUT', payload);
}

export function deleteAdminUser(id: number) {
  return send<void>(`/api/admin/users/${id}`, 'DELETE');
}

