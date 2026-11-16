import { request, send, sendForm } from '../../../services/http';

export interface GraphType {
  code: string;
  name: string;
  color?: string;
  icon?: string;
  inverseName?: string;
  directed?: boolean | number;
}

export interface GraphOverview {
  nodeCount: number;
  edgeCount: number;
  nodeTypeCount: number;
  edgeTypeCount: number;
  tagCount: number;
  nodeTypes: GraphType[];
  edgeTypes: GraphType[];
}

export function fetchGraphOverview() {
  return request<GraphOverview>('/api/graph/overview');
}

export interface NodeTypeItem {
  id: number;
  typeCode: string;
  typeName: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface NodeTypesResponse {
  total: number;
  items: NodeTypeItem[];
}

export interface GraphNodeMediaItem {
  linkId: number;
  id: number;
  fileId: number;
  bucketName: string;
  objectKey: string;
  originalName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
  contentType?: string;
  fileSize?: number;
  previewUrl?: string;
  caption?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphNodeMediaResponse {
  total: number;
  items: GraphNodeMediaItem[];
}

export interface GraphNodeItem {
  id: number;
  nodeCode: string;
  nodeTypeId: number;
  nodeTypeCode?: string;
  nodeTypeName: string;
  category?: string;
  sourceName?: string;
  sourceUrl?: string;
  nodeTypeColor?: string;
  name: string;
  alias?: string;
  summary?: string;
  content?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  historicalPeriod?: string;
  projectLevel?: string;
  birthYear?: number;
  coverImageUrl?: string;
  coverImageCaption?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  auditStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  popularityCount?: number;
  mediaFiles?: GraphNodeMediaItem[];
  updatedAt?: string;
  createdAt?: string;
}

export interface GraphNodeListResponse {
  page: number;
  size: number;
  total: number;
  items: GraphNodeItem[];
}

export interface GraphHubItem {
  id: number;
  name: string;
  nodeTypeCode: string;
  nodeTypeName: string;
  degree: number;
}

export interface GraphHubsResponse {
  total: number;
  items: GraphHubItem[];
}

export interface GraphNodePayload {
  nodeCode?: string;
  nodeTypeId?: number;
  name?: string;
  alias?: string;
  category?: string;
  summary?: string;
  content?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  historicalPeriod?: string;
  projectLevel?: string;
  birthYear?: number;
  sourceName?: string;
  sourceUrl?: string;
  coverImageUrl?: string;
  coverImageCaption?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  auditStatus?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface EdgeTypeItem {
  id: number;
  typeCode: string;
  typeName: string;
  inverseName?: string;
  directed: boolean | number;
  description?: string;
}

export interface EdgeTypesResponse {
  total: number;
  items: EdgeTypeItem[];
}

export interface GraphEdgeItem {
  id: number;
  sourceNodeId: number;
  sourceNodeName: string;
  sourceNodeCode: string;
  targetNodeId: number;
  targetNodeName: string;
  targetNodeCode: string;
  edgeTypeId: number;
  edgeTypeCode: string;
  edgeTypeName: string;
  directed: boolean | number;
  weight: number;
  relationLabel?: string;
  startYear?: number;
  endYear?: number;
  auditStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  updatedAt?: string;
  createdAt?: string;
}

export interface GraphEdgeListResponse {
  page: number;
  size: number;
  total: number;
  items: GraphEdgeItem[];
}

export interface GraphEdgePayload {
  sourceNodeId?: number;
  targetNodeId?: number;
  edgeTypeId?: number;
  directed?: boolean;
  weight?: number;
  relationLabel?: string;
  startYear?: number | null;
  endYear?: number | null;
  auditStatus?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface GraphVisualizationNode {
  id: number;
  nodeCode: string;
  name: string;
  summary?: string;
  province?: string;
  city?: string;
  auditStatus: string;
  nodeTypeCode: string;
  nodeTypeName: string;
  nodeTypeColor?: string;
}

export interface GraphVisualizationEdge {
  id: number;
  sourceNodeId: number;
  sourceNodeCode: string;
  sourceNodeName: string;
  targetNodeId: number;
  targetNodeCode: string;
  targetNodeName: string;
  edgeTypeCode: string;
  edgeTypeName: string;
  directed: boolean | number;
  weight: number;
  relationLabel?: string;
  auditStatus: string;
}

export interface GraphVisualizationResponse {
  page: number;
  size: number;
  total: number;
  nodeCount: number;
  edgeCount: number;
  nodes: GraphVisualizationNode[];
  edges: GraphVisualizationEdge[];
}

export interface SemanticChain {
  title: string;
  nodes: Array<{
    id: number;
    nodeCode: string;
    name: string;
    nodeTypeCode: string;
  }>;
  edges: Array<{
    id: number;
    edgeTypeCode: string;
    relationLabel?: string;
  }>;
}

export interface SemanticSearchResponse {
  question: string;
  total: number;
  chains: SemanticChain[];
}

export interface GraphRelationHint {
  id: number;
  sourceNodeId: number;
  sourceNodeName: string;
  sourceTypeCode: string;
  targetNodeId: number;
  targetNodeName: string;
  targetTypeCode: string;
  edgeTypeCode: string;
  edgeTypeName: string;
  relationLabel?: string;
}

export interface GraphSearchGroup {
  typeCode: string;
  typeName: string;
  count: number;
  items: GraphNodeItem[];
}

export interface GraphSearchResponse {
  keyword: string;
  page: number;
  size: number;
  total: number;
  items: GraphNodeItem[];
  groups: GraphSearchGroup[];
  relationHints?: GraphRelationHint[];
}

export interface GraphRelationsResponse {
  startNodeId: number;
  depth: number;
  direction: 'in' | 'out' | 'both';
  nodeCount: number;
  edgeCount: number;
  nodes: GraphVisualizationNode[];
  edges: GraphVisualizationEdge[];
}

export interface GraphPathSearchPayload {
  startNodeId: number;
  paths: string[][];
  limit?: number;
}

export interface GraphPathSearchResponse {
  startNodeId: number;
  total: number;
  chains: SemanticChain[];
}

export interface GraphAiSearchPayload {
  question: string;
  mode?: string;
  topK?: number;
  currentNodeId?: number;
}

export interface GraphAiSearchResult {
  id: number;
  name: string;
  nodeTypeCode: string;
  nodeTypeName?: string;
  summary?: string;
  province?: string;
  city?: string;
  relations?: string[];
  /**
   * Which node this hit was reached from, and a direction-aware one-liner about the relation
   * (`是「苗族赶秋」的传承人`). The raw edge label reads backwards on a person card, so the card
   * prefers `relationSummary` and only falls back to `relations` when the backend sends none.
   */
  sourceNodeId?: number;
  sourceName?: string;
  relationSummary?: string;
}

export interface GraphAiSearchResponse {
  question: string;
  mode: string;
  answer: string;
  results: GraphAiSearchResult[];
  plan: Record<string, unknown>;
  search: GraphSearchResponse;
  execution: GraphPathSearchResponse;
}

export function fetchNodeTypes() {
  return request<NodeTypesResponse>('/api/graph/node-types');
}

export function fetchGraphNodes(params: {
  keyword?: string;
  nodeTypeId?: number | '';
  auditStatus?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.nodeTypeId) search.set('nodeTypeId', String(params.nodeTypeId));
  if (params.auditStatus) search.set('auditStatus', params.auditStatus);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<GraphNodeListResponse>(`/api/graph/nodes?${search.toString()}`);
}

/** 关系数最多的节点：看板首屏默认以它为中心。 */
export function fetchGraphHubs(limit = 5) {
  return request<GraphHubsResponse>(`/api/graph/hubs?limit=${limit}`);
}

export function fetchGraphNode(id: number | string, options: { includeAllMedia?: boolean } = {}) {
  const search = new URLSearchParams();
  if (options.includeAllMedia) search.set('includeAllMedia', 'true');
  const query = search.toString();
  return request<GraphNodeItem>(`/api/graph/nodes/${id}${query ? `?${query}` : ''}`);
}

export function fetchGraphNodeMediaFiles(id: number | string, options: { includeAllMedia?: boolean } = {}) {
  const search = new URLSearchParams();
  if (options.includeAllMedia) search.set('includeAllMedia', 'true');
  const query = search.toString();
  return request<GraphNodeMediaResponse>(`/api/graph/nodes/${id}/media${query ? `?${query}` : ''}`);
}

export function createGraphNode(payload: GraphNodePayload) {
  return send<GraphNodeItem>('/api/graph/nodes', 'POST', payload);
}

export function updateGraphNode(id: number, payload: GraphNodePayload) {
  return send<GraphNodeItem>(`/api/graph/nodes/${id}`, 'PUT', payload);
}

export function deleteGraphNode(id: number) {
  return send<void>(`/api/graph/nodes/${id}`, 'DELETE');
}

export function fetchEdgeTypes() {
  return request<EdgeTypesResponse>('/api/graph/edge-types');
}

export function fetchGraphEdges(params: {
  keyword?: string;
  edgeTypeId?: number | '';
  auditStatus?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.edgeTypeId) search.set('edgeTypeId', String(params.edgeTypeId));
  if (params.auditStatus) search.set('auditStatus', params.auditStatus);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<GraphEdgeListResponse>(`/api/graph/edges?${search.toString()}`);
}

export function fetchGraphEdge(id: number | string) {
  return request<GraphEdgeItem>(`/api/graph/edges/${id}`);
}

export function createGraphEdge(payload: GraphEdgePayload) {
  return send<GraphEdgeItem>('/api/graph/edges', 'POST', payload);
}

export function updateGraphEdge(id: number, payload: GraphEdgePayload) {
  return send<GraphEdgeItem>(`/api/graph/edges/${id}`, 'PUT', payload);
}

export function deleteGraphEdge(id: number) {
  return send<void>(`/api/graph/edges/${id}`, 'DELETE');
}

export function fetchGraphVisualization(params: {
  keyword?: string;
  nodeTypeId?: number | '';
  edgeTypeId?: number | '';
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.nodeTypeId) search.set('nodeTypeId', String(params.nodeTypeId));
  if (params.edgeTypeId) search.set('edgeTypeId', String(params.edgeTypeId));
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 15));
  return request<GraphVisualizationResponse>(`/api/graph/visualization?${search.toString()}`);
}

export function semanticSearch(question: string) {
  const search = new URLSearchParams({ question });
  return request<SemanticSearchResponse>(`/api/graph/search/semantic?${search.toString()}`);
}

export function unifiedGraphSearch(params: {
  keyword?: string;
  typeCodes?: string[];
  includeRelations?: boolean;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  params.typeCodes?.forEach((typeCode) => search.append('typeCodes', typeCode));
  if (params.includeRelations !== undefined) search.set('includeRelations', String(params.includeRelations));
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 20));
  return request<GraphSearchResponse>(`/api/graph/search?${search.toString()}`);
}

export function fetchGraphRelations(
  nodeId: number,
  params: {
    depth?: number;
    direction?: 'in' | 'out' | 'both';
    relationTypes?: string[];
    limit?: number;
  } = {},
) {
  const search = new URLSearchParams();
  search.set('depth', String(params.depth ?? 1));
  search.set('direction', params.direction ?? 'both');
  params.relationTypes?.forEach((typeCode) => search.append('relationTypes', typeCode));
  search.set('limit', String(params.limit ?? 80));
  return request<GraphRelationsResponse>(`/api/graph/nodes/${nodeId}/relations?${search.toString()}`);
}

export function graphPathSearch(payload: GraphPathSearchPayload) {
  return send<GraphPathSearchResponse>('/api/graph/search/path', 'POST', payload);
}

export function graphAiSearch(payload: GraphAiSearchPayload) {
  return send<GraphAiSearchResponse>('/api/graph/search/ai', 'POST', payload);
}

