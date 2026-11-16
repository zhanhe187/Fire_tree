import { request, send, sendForm } from '../../../services/http';

export interface SearchHotItem {
  keyword: string;
  searchType: 'KEYWORD' | 'SEMANTIC' | 'TAG';
  searchCount: number;
  resultTotal?: number;
  lastSearchedAt?: string;
}

export interface SearchHotResponse {
  items: SearchHotItem[];
}

export interface BehaviorTrendItem {
  date: string;
  behaviorType: string;
  targetType: string;
  eventCount: number;
}

export interface BehaviorTrendResponse {
  days: number;
  items: BehaviorTrendItem[];
}

export interface OperationAuditItem {
  id: number;
  operatorId?: number;
  operatorUsername?: string;
  operatorName?: string;
  operation: string;
  resourceType?: string;
  resourceId?: number;
  requestMethod?: string;
  requestUri?: string;
  requestBody?: string;
  success?: boolean | number;
  errorMessage?: string;
  createdAt?: string;
}

export interface OperationAuditResponse {
  page: number;
  size: number;
  total: number;
  items: OperationAuditItem[];
}

export interface AnalyticsCategoryItem {
  typeCode: string;
  typeName: string;
  color?: string;
  nodeCount: number;
  percentage: number;
}

export interface AnalyticsAgeBucket {
  label: string;
  minAge: number;
  maxAge: number;
  nodeCount: number;
}

export interface AnalyticsProvinceItem {
  province: string;
  nodeCount: number;
  longitude: number;
  latitude: number;
  popularityTotal: number;
}

export interface AnalyticsTrackItem {
  id: number;
  edgeTypeCode: string;
  edgeTypeName: string;
  relationLabel?: string;
  sourceNodeId: number;
  sourceNodeCode: string;
  sourceNodeName: string;
  sourceProvince?: string;
  sourceCity?: string;
  sourceLongitude?: number;
  sourceLatitude?: number;
  targetNodeId: number;
  targetNodeCode: string;
  targetNodeName: string;
  targetProvince?: string;
  targetCity?: string;
  targetLongitude?: number;
  targetLatitude?: number;
}

export interface AnalyticsOverviewResponse {
  totals: {
    nodeCount: number;
    provinceCount: number;
    trackCount: number;
  };
  categoryShare: AnalyticsCategoryItem[];
  ageBuckets: AnalyticsAgeBucket[];
  provinceHeatmap: AnalyticsProvinceItem[];
  propagationTracks: AnalyticsTrackItem[];
}

export function fetchSearchHot(limit = 10) {
  const search = new URLSearchParams({ limit: String(limit) });
  return request<SearchHotResponse>(`/api/analytics/search-hot?${search.toString()}`);
}

export function fetchBehaviorTrend(days = 7) {
  const search = new URLSearchParams({ days: String(days) });
  return request<BehaviorTrendResponse>(`/api/analytics/behavior-trend?${search.toString()}`);
}

export function fetchOperationAudit(params: {
  keyword?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<OperationAuditResponse>(`/api/analytics/operation-audit?${search.toString()}`);
}

export function fetchAnalyticsOverview() {
  return request<AnalyticsOverviewResponse>('/api/analytics/overview');
}

