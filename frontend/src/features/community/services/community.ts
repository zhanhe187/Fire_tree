import { request, send, sendForm } from '../../../services/http';

export type CommunityStatus = 'PUBLISHED' | 'BLOCKED' | 'DELETED';

export type CommunityTargetType = 'QUESTION' | 'ANSWER';

export interface CommunityCommentItem {
  id: number;
  targetType: CommunityTargetType;
  targetId: number;
  authorId: number;
  authorName: string;
  content: string;
  status: CommunityStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityAnswerItem {
  id: number;
  questionId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  accepted?: boolean | number;
  likeCount: number;
  liked?: boolean | number;
  status: CommunityStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityRelatedInheritor {
  id: number;
  nodeCode: string;
  name: string;
}

export interface CommunityQuestionItem {
  id: number;
  nodeId?: number;
  nodeCode?: string;
  nodeName?: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  imageUrl?: string;
  answerCount: number;
  viewCount: number;
  likeCount: number;
  liked?: boolean | number;
  status: CommunityStatus;
  createdAt?: string;
  updatedAt?: string;
  answers?: CommunityAnswerItem[];
  comments?: CommunityCommentItem[];
  relatedInheritors?: CommunityRelatedInheritor[];
}

export interface CommunityQuestionListResponse {
  page: number;
  size: number;
  total: number;
  items: CommunityQuestionItem[];
}

export interface CommunityQuestionPayload {
  nodeId?: number | null;
  authorId?: number;
  title?: string;
  content?: string;
  imageUrl?: string;
}

export interface CommunityAnswerPayload {
  authorId?: number;
  content?: string;
}

export interface CommunityCommentPayload {
  authorId?: number;
  content?: string;
}

export interface CommunityLikePayload {
  userId?: number;
}

export interface CommunityLikeResponse {
  targetType: CommunityTargetType;
  targetId: number;
  liked?: boolean | number;
  likeCount: number;
}

export function fetchCommunityQuestions(params: {
  keyword?: string;
  nodeId?: number | '';
  authorId?: number | '';
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.nodeId) search.set('nodeId', String(params.nodeId));
  if (params.authorId) search.set('authorId', String(params.authorId));
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<CommunityQuestionListResponse>(`/api/community/questions?${search.toString()}`);
}

export function fetchCommunityQuestion(id: number) {
  return request<CommunityQuestionItem>(`/api/community/questions/${id}`);
}

export interface CommunityReplySinceResponse {
  questionId: number;
  newAnswerCount: number;
  newCommentCount: number;
  totalNewReplyCount: number;
}

export function fetchCommunityRepliesSince(questionId: number, since: string) {
  return request<CommunityReplySinceResponse>(`/api/community/questions/${questionId}/replies-since?since=${encodeURIComponent(since)}`);
}

export function createCommunityQuestion(payload: CommunityQuestionPayload) {
  return send<CommunityQuestionItem>('/api/community/questions', 'POST', payload);
}

export function createCommunityAnswer(questionId: number, payload: CommunityAnswerPayload) {
  return send<CommunityAnswerItem>(`/api/community/questions/${questionId}/answers`, 'POST', payload);
}

export function createCommunityQuestionComment(questionId: number, payload: CommunityCommentPayload) {
  return send<CommunityCommentItem>(`/api/community/questions/${questionId}/comments`, 'POST', payload);
}

export function createCommunityAnswerComment(answerId: number, payload: CommunityCommentPayload) {
  return send<CommunityCommentItem>(`/api/community/answers/${answerId}/comments`, 'POST', payload);
}

export function likeCommunityQuestion(questionId: number, payload: CommunityLikePayload) {
  return send<CommunityLikeResponse>(`/api/community/questions/${questionId}/likes`, 'POST', payload);
}

export function deleteCommunityQuestion(questionId: number) {
  return send<void>(`/api/community/questions/${questionId}`, 'DELETE');
}
