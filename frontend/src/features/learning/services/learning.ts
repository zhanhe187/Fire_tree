import { request, send, sendForm } from '../../../services/http';

export interface LearningRecommendationItem {
  id: number;
  nodeId: number;
  nodeCode: string;
  nodeName: string;
  nodeTypeName: string;
  summary?: string;
  province?: string;
  popularityCount: number;
  reason: string;
  sortOrder: number;
}

export interface LearningRecommendationResponse {
  id: number;
  recommendDate: string;
  title: string;
  ruleSnapshot?: string;
  createdAt?: string;
  total: number;
  items: LearningRecommendationItem[];
}

export interface LearningHotItem {
  id: number;
  nodeCode: string;
  nodeName: string;
  nodeTypeName: string;
  summary?: string;
  province?: string;
  popularityCount: number;
  favoriteCount: number;
  recommendCount: number;
  hotScore: number;
}

export interface LearningHotResponse {
  total: number;
  items: LearningHotItem[];
}

export interface LearningCheckinItem {
  id: number;
  userId: number;
  checkinDate: string;
  recommendationId?: number;
  continuousDays: number;
  createdAt?: string;
}

export interface LearningCheckinResponse {
  userId: number;
  month: string;
  total: number;
  currentStreak: number;
  items: LearningCheckinItem[];
}

export interface LearningCheckinPayload {
  userId?: number;
  username?: string;
  date?: string;
}

export function fetchDailyRecommendation(date?: string) {
  const search = new URLSearchParams();
  if (date) search.set('date', date);
  return request<LearningRecommendationResponse>(`/api/learning/recommendations/daily?${search.toString()}`);
}

export function generateDailyRecommendation(params: { date?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);
  search.set('limit', String(params.limit ?? 6));
  return send<LearningRecommendationResponse>(`/api/learning/recommendations/generate?${search.toString()}`, 'POST');
}

export function fetchLearningHot(limit = 10) {
  const search = new URLSearchParams({ limit: String(limit) });
  return request<LearningHotResponse>(`/api/learning/hot?${search.toString()}`);
}

export function fetchLearningCheckins(params: { userId?: number; username?: string; month: string }) {
  const search = new URLSearchParams({ month: params.month });
  if (params.username) search.set('username', params.username);
  else if (params.userId) search.set('userId', String(params.userId));
  return request<LearningCheckinResponse>(`/api/learning/checkins?${search.toString()}`);
}

export function createLearningCheckin(payload: LearningCheckinPayload) {
  return send<LearningCheckinItem>('/api/learning/checkins', 'POST', payload);
}

