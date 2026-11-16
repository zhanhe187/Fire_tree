import { request, send, sendForm } from '../../../services/http';
import type { LinkedProductItem } from '../../product/services/product';

export interface ArticleItem {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  coverFileId?: number;
  coverUrl?: string;
  linkedNodeCoverUrl?: string;
  relatedNodeCoverUrl?: string;
  relatedNodeId?: number;
  relatedNodeCode?: string;
  relatedNodeName?: string;
  authorId?: number;
  authorName?: string;
  articleType: 'NEWS' | 'ACTIVITY' | 'STUDY';
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE';
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  linkedNodeCount?: number;
  linkedNodes?: ArticleNodeItem[];
  linkedProducts?: LinkedProductItem[];
}

export interface ArticleListResponse {
  page: number;
  size: number;
  total: number;
  items: ArticleItem[];
}

export interface ArticlePayload {
  title?: string;
  summary?: string;
  content?: string;
  coverFileId?: number | null;
  relatedNodeId?: number | null;
  articleType?: 'NEWS' | 'ACTIVITY' | 'STUDY';
  status?: 'DRAFT' | 'PUBLISHED' | 'OFFLINE';
}

export interface ArticleNodePayload {
  nodeId?: number;
}

export interface ArticleNodeItem {
  id: number;
  nodeId: number;
  nodeCode: string;
  nodeName: string;
  nodeTypeCode: string;
  nodeTypeName: string;
  createdAt?: string;
}

export function fetchArticles(params: {
  keyword?: string;
  articleType?: string;
  status?: string;
  backstage?: boolean;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.articleType) search.set('articleType', params.articleType);
  if (params.status) search.set('status', params.status);
  if (params.backstage) search.set('backstage', 'true');
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<ArticleListResponse>(`/api/articles?${search.toString()}`);
}

export function fetchArticle(id: number, options: { backstage?: boolean } = {}) {
  const search = new URLSearchParams();
  if (options.backstage) search.set('backstage', 'true');
  const suffix = search.size ? `?${search.toString()}` : '';
  return request<ArticleItem>(`/api/articles/${id}${suffix}`);
}

export function createArticle(payload: ArticlePayload) {
  return send<ArticleItem>('/api/articles', 'POST', payload);
}

export function updateArticle(id: number, payload: ArticlePayload) {
  return send<ArticleItem>(`/api/articles/${id}`, 'PUT', payload);
}

export function deleteArticle(id: number) {
  return send<void>(`/api/articles/${id}`, 'DELETE');
}

export function publishArticle(id: number) {
  return send<ArticleItem>(`/api/articles/${id}/publish`, 'PUT');
}

export function offlineArticle(id: number) {
  return send<ArticleItem>(`/api/articles/${id}/offline`, 'PUT');
}

export function linkArticleNode(id: number, payload: ArticleNodePayload) {
  return send<ArticleItem>(`/api/articles/${id}/nodes`, 'POST', payload);
}

export function unlinkArticleNode(id: number, nodeId: number) {
  return send<void>(`/api/articles/${id}/nodes/${nodeId}`, 'DELETE');
}

export function linkArticleProduct(id: number, productId: number) {
  return send<ArticleItem>(`/api/articles/${id}/products`, 'POST', { productId });
}

export function unlinkArticleProduct(id: number, productId: number) {
  return send<void>(`/api/articles/${id}/products/${productId}`, 'DELETE');
}
