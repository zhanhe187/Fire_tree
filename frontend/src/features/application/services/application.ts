import { request, send, sendForm } from '../../../services/http';

export type ApplicationType = 'PROJECT' | 'INHERITOR' | 'MEDIA' | 'RELATION';

export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED' | 'CANCELLED';

export interface ReviewLogItem {
  id: number;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  reviewComment?: string;
  reviewerId?: number;
  reviewerName?: string;
  createdAt?: string;
}

export interface ApplicationItem {
  id: number;
  applicationNo: string;
  applicantUserId: number;
  applicantName: string;
  targetNodeId?: number;
  targetNodeCode?: string;
  targetNodeName?: string;
  applicationType: ApplicationType;
  title: string;
  formData?: string;
  status: ApplicationStatus;
  currentStep: number;
  reviewComment?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerId?: number;
  reviewerName?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewLogs?: ReviewLogItem[];
}

export interface ApplicationListResponse {
  page: number;
  size: number;
  total: number;
  items: ApplicationItem[];
}

export interface ApplicationPayload {
  applicationNo?: string;
  applicantUserId?: number;
  applicantUsername?: string;
  targetNodeId?: number | null;
  applicationType?: ApplicationType;
  title?: string;
  formData?: Record<string, unknown>;
  currentStep?: number;
}

export interface ReviewDecisionPayload {
  reviewerId?: number;
  reviewComment?: string;
}

export function fetchApplications(params: {
  keyword?: string;
  status?: string;
  applicationType?: string;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.status) search.set('status', params.status);
  if (params.applicationType) search.set('applicationType', params.applicationType);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<ApplicationListResponse>(`/api/applications?${search.toString()}`);
}

export function fetchApplication(id: number) {
  return request<ApplicationItem>(`/api/applications/${id}`);
}

export function createApplication(payload: ApplicationPayload) {
  return send<ApplicationItem>('/api/applications', 'POST', payload);
}

export function updateApplication(id: number, payload: ApplicationPayload) {
  return send<ApplicationItem>(`/api/applications/${id}`, 'PUT', payload);
}

export function deleteApplication(id: number) {
  return send<void>(`/api/applications/${id}`, 'DELETE');
}

export function submitApplication(id: number) {
  return send<ApplicationItem>(`/api/applications/${id}/submit`, 'PUT');
}

export function approveApplication(id: number, payload: ReviewDecisionPayload) {
  return send<ApplicationItem>(`/api/applications/${id}/approve`, 'PUT', payload);
}

export function rejectApplication(id: number, payload: ReviewDecisionPayload) {
  return send<ApplicationItem>(`/api/applications/${id}/reject`, 'PUT', payload);
}

