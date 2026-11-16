import { request, send, sendForm } from '../../../services/http';
import type { LinkedProductItem } from '../../product/services/product';

export interface ExhibitionNodeItem {
  id: number;
  nodeId: number;
  nodeCode: string;
  nodeName: string;
  nodeTypeCode: string;
  nodeTypeName: string;
  boothNo?: string;
  createdAt?: string;
}

export interface ExhibitionItem {
  id: number;
  title: string;
  description?: string;
  coverFileId?: number;
  coverUrl?: string;
  linkedNodeCoverUrl?: string;
  province?: string;
  city?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  startTime?: string;
  endTime?: string;
  organizer?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE';
  createdBy?: number;
  creatorName?: string;
  linkedNodeCount?: number;
  createdAt?: string;
  updatedAt?: string;
  linkedNodes?: ExhibitionNodeItem[];
  linkedProducts?: LinkedProductItem[];
}

export interface ExhibitionListResponse {
  page: number;
  size: number;
  total: number;
  items: ExhibitionItem[];
}

export interface ExhibitionPayload {
  title?: string;
  description?: string;
  coverFileId?: number | null;
  province?: string;
  city?: string;
  address?: string;
  longitude?: number | null;
  latitude?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  organizer?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'OFFLINE';
}

export interface ExhibitionNodePayload {
  nodeId?: number;
  boothNo?: string;
}

export function fetchExhibitions(params: {
  keyword?: string;
  province?: string;
  city?: string;
  status?: string;
  backstage?: boolean;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.province) search.set('province', params.province);
  if (params.city) search.set('city', params.city);
  if (params.status) search.set('status', params.status);
  if (params.backstage) search.set('backstage', 'true');
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<ExhibitionListResponse>(`/api/exhibitions?${search.toString()}`);
}

export function fetchExhibition(id: number, options: { backstage?: boolean } = {}) {
  const search = new URLSearchParams();
  if (options.backstage) search.set('backstage', 'true');
  const suffix = search.size ? `?${search.toString()}` : '';
  return request<ExhibitionItem>(`/api/exhibitions/${id}${suffix}`);
}

export function createExhibition(payload: ExhibitionPayload) {
  return send<ExhibitionItem>('/api/exhibitions', 'POST', payload);
}

export function updateExhibition(id: number, payload: ExhibitionPayload) {
  return send<ExhibitionItem>(`/api/exhibitions/${id}`, 'PUT', payload);
}

export function deleteExhibition(id: number) {
  return send<void>(`/api/exhibitions/${id}`, 'DELETE');
}

export function linkExhibitionNode(id: number, payload: ExhibitionNodePayload) {
  return send<ExhibitionItem>(`/api/exhibitions/${id}/nodes`, 'POST', payload);
}

export function unlinkExhibitionNode(id: number, nodeId: number) {
  return send<void>(`/api/exhibitions/${id}/nodes/${nodeId}`, 'DELETE');
}

export function linkExhibitionProduct(id: number, productId: number) {
  return send<ExhibitionItem>(`/api/exhibitions/${id}/products`, 'POST', { productId });
}

export function unlinkExhibitionProduct(id: number, productId: number) {
  return send<void>(`/api/exhibitions/${id}/products/${productId}`, 'DELETE');
}
