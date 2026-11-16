import { request, send, sendForm } from '../../../services/http';
import type { GraphVisualizationEdge, GraphVisualizationNode } from '../../graph/services/graph';

export interface FavoriteNodeItem {
  id: number;
  userId: number;
  nodeId: number;
  nodeCode: string;
  nodeName: string;
  nodeTypeCode: string;
  nodeTypeName: string;
  nodeTypeColor?: string;
  summary?: string;
  province?: string;
  city?: string;
  popularityCount?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoriteNodeListResponse {
  page: number;
  size: number;
  total: number;
  items: FavoriteNodeItem[];
}

export interface FavoriteNodePayload {
  userId?: number;
  username?: string;
  nodeId?: number;
  note?: string;
}

export interface FavoriteGraphNode extends GraphVisualizationNode {
  favorited?: boolean | number;
  note?: string;
}

export interface FavoriteGraphResponse {
  nodeCount: number;
  edgeCount: number;
  nodes: FavoriteGraphNode[];
  edges: GraphVisualizationEdge[];
}

export function fetchFavoriteNodes(params: {
  userId?: number;
  username?: string;
  keyword?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.username) search.set('username', params.username);
  else if (params.userId) search.set('userId', String(params.userId));
  if (params.keyword) search.set('keyword', params.keyword);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<FavoriteNodeListResponse>(`/api/favorites/nodes?${search.toString()}`);
}

export function createFavoriteNode(payload: FavoriteNodePayload) {
  return send<FavoriteNodeItem>('/api/favorites/nodes', 'POST', payload);
}

export function updateFavoriteNote(nodeId: number, payload: FavoriteNodePayload) {
  return send<FavoriteNodeItem>(`/api/favorites/nodes/${nodeId}`, 'PUT', payload);
}

export function deleteFavoriteNode(userId: number, nodeId: number) {
  const search = new URLSearchParams({ userId: String(userId) });
  return send<void>(`/api/favorites/nodes/${nodeId}?${search.toString()}`, 'DELETE');
}

export function deleteFavoriteNodeByUsername(username: string, nodeId: number) {
  const search = new URLSearchParams({ username });
  return send<void>(`/api/favorites/nodes/${nodeId}?${search.toString()}`, 'DELETE');
}

export function fetchFavoriteGraph(userIdOrUsername: number | string) {
  const search = new URLSearchParams(
    typeof userIdOrUsername === 'string'
      ? { username: userIdOrUsername }
      : { userId: String(userIdOrUsername) },
  );
  return request<FavoriteGraphResponse>(`/api/favorites/graph?${search.toString()}`);
}

