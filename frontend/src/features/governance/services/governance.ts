import { request, send, sendForm } from '../../../services/http';
import type { OperationAuditResponse } from '../../analytics/services/analytics';

export interface SensitiveWordItem {
  id: number;
  word: string;
  wordType: string;
  severity: number;
  status: number;
  createdBy?: number;
  creatorUsername?: string;
  creatorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SensitiveWordListResponse {
  page: number;
  size: number;
  total: number;
  items: SensitiveWordItem[];
}

export interface SensitiveWordPayload {
  word: string;
  wordType?: string;
  severity?: number;
  status?: number;
}

export interface ContentReviewRecordItem {
  id: number;
  contentType: string;
  contentId?: number;
  rawContent: string;
  matchedWords?: string;
  status: string;
  createdAt?: string;
}

export interface ContentReviewRecordResponse {
  page: number;
  size: number;
  total: number;
  items: ContentReviewRecordItem[];
}

export interface RiskReportItem {
  id: number;
  ruleCode: string;
  ruleName: string;
  nodeId?: number;
  nodeCode?: string;
  nodeName?: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IGNORED' | 'RESOLVED';
  detectedAt: string;
  resolvedAt?: string;
  resolverId?: number;
  resolverNote?: string;
}

export interface RiskResolvePayload {
  decision?: 'RESOLVED' | 'IGNORED';
  comment?: string;
}

export interface RiskReportResponse {
  page: number;
  size: number;
  total: number;
  items: RiskReportItem[];
  summary: {
    open: number;
    high: number;
    pending: number;
    resolved: number;
  };
}

export interface RiskScanResponse {
  scannedCount: number;
  generatedCount: number;
  openCount: number;
}

export function fetchSensitiveWords(params: {
  keyword?: string;
  wordType?: string;
  status?: number | string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.wordType) search.set('wordType', params.wordType);
  if (params.status !== undefined && params.status !== '') search.set('status', String(params.status));
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<SensitiveWordListResponse>(`/api/content-governance/sensitive-words?${search.toString()}`);
}

export function createSensitiveWord(payload: SensitiveWordPayload) {
  return send<SensitiveWordItem>('/api/content-governance/sensitive-words', 'POST', payload);
}

export function updateSensitiveWord(id: number, payload: SensitiveWordPayload) {
  return send<SensitiveWordItem>(`/api/content-governance/sensitive-words/${id}`, 'PUT', payload);
}

export function deleteSensitiveWord(id: number) {
  return send<void>(`/api/content-governance/sensitive-words/${id}`, 'DELETE');
}

export function fetchContentReviewRecords(params: {
  keyword?: string;
  contentType?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.contentType) search.set('contentType', params.contentType);
  if (params.status) search.set('status', params.status);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<ContentReviewRecordResponse>(`/api/content-governance/review-records?${search.toString()}`);
}

export function fetchContentGovernanceOperationLogs(params: {
  keyword?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<OperationAuditResponse>(`/api/content-governance/operation-logs?${search.toString()}`);
}

export function scanRisks() {
  return send<RiskScanResponse>('/api/risk/scan', 'POST');
}

export function fetchRiskReports(params: {
  keyword?: string;
  severity?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.severity) search.set('severity', params.severity);
  if (params.status) search.set('status', params.status);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<RiskReportResponse>(`/api/risk/reports?${search.toString()}`);
}

export function resolveRiskReport(id: number, payload: RiskResolvePayload = {}) {
  return send<RiskReportItem>(`/api/risk/reports/${id}/resolve`, 'PUT', payload);
}

