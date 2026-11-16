import { request, send, sendForm } from '../../../services/http';

export interface MediaFileItem {
  id: number;
  bucketName: string;
  objectKey: string;
  originalName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
  contentType?: string;
  fileSize: number;
  checksum?: string;
  previewUrl?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  auditStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  linkedNodeCount?: number;
  linkedNodeNames?: string;
  captions?: string;
  createdAt?: string;
  updatedAt?: string;
  linkedNodes?: MediaLinkedNode[];
}

export interface MediaLinkedNode {
  linkId: number;
  nodeId: number;
  nodeCode: string;
  nodeName: string;
  nodeTypeCode: string;
  nodeTypeName: string;
  caption?: string;
  sortOrder: number;
}

export interface MediaFileListResponse {
  page: number;
  size: number;
  total: number;
  items: MediaFileItem[];
}

export interface MediaFilePayload {
  bucketName?: string;
  objectKey?: string;
  originalName?: string;
  fileType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
  contentType?: string;
  fileSize?: number;
  checksum?: string;
  previewUrl?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  auditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface MediaLinkPayload {
  nodeId?: number;
  caption?: string;
  sortOrder?: number;
}

export interface MediaSubmissionResponse {
  media: MediaFileItem;
  directApproved: boolean;
  auditStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  visibility: 'PUBLIC' | 'PRIVATE';
}

export function fetchMediaFiles(params: {
  keyword?: string;
  fileType?: string;
  auditStatus?: string;
  nodeId?: number | '';
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.fileType) search.set('fileType', params.fileType);
  if (params.auditStatus) search.set('auditStatus', params.auditStatus);
  if (params.nodeId) search.set('nodeId', String(params.nodeId));
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<MediaFileListResponse>(`/api/media/files?${search.toString()}`);
}

export function fetchMediaFile(id: number) {
  return request<MediaFileItem>(`/api/media/files/${id}`);
}

export function createMediaFile(payload: MediaFilePayload) {
  return send<MediaFileItem>('/api/media/files', 'POST', payload);
}

export function updateMediaFile(id: number, payload: MediaFilePayload) {
  return send<MediaFileItem>(`/api/media/files/${id}`, 'PUT', payload);
}

// Replace the binary content of an existing record in place (no new row, no 409 conflict).
export function replaceMediaFileContent(id: number, file: File) {
  const form = new FormData();
  form.set('file', file);
  return sendForm<MediaFileItem>(`/api/media/files/${id}/content`, form);
}

export function deleteMediaFile(id: number) {
  return send<void>(`/api/media/files/${id}`, 'DELETE');
}

export function linkMediaNode(id: number, payload: MediaLinkPayload) {
  return send<MediaLinkedNode>(`/api/media/files/${id}/links`, 'POST', payload);
}

export function submitImageMaterial(payload: { nodeId: number; caption?: string; file: File }) {
  const form = new FormData();
  form.set('nodeId', String(payload.nodeId));
  if (payload.caption) form.set('caption', payload.caption);
  form.set('file', payload.file);
  return sendForm<MediaSubmissionResponse>('/api/media/submissions', form);
}

export function uploadMediaImage(file: File) {
  const form = new FormData();
  form.set('file', file);
  return sendForm<MediaFileItem>('/api/media/uploads/images', form);
}
export function uploadMediaFile(file: File) {
  const form = new FormData();
  form.set('file', file);
  return sendForm<MediaFileItem>('/api/media/uploads', form);
}

export function unlinkMediaNode(id: number, nodeId: number) {
  return send<void>(`/api/media/files/${id}/links/${nodeId}`, 'DELETE');
}

// 一键审核：APPROVE 会同时把可见性置为 PUBLIC，避免“审核通过但仍不可见”。
export function auditMediaFile(id: number, action: 'APPROVE' | 'REJECT') {
  return send<MediaFileItem>(`/api/media/files/${id}/audit`, 'PUT', { action });
}

// 只补图像说明：给节点当前封面写 caption，不新增图片。
export function updateNodeCoverCaption(nodeId: number, caption: string) {
  return send<{ nodeId: number; caption: string }>(`/api/media/nodes/${nodeId}/cover-caption`, 'PUT', { caption });
}
