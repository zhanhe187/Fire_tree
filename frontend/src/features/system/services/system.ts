import { request, send, sendForm } from '../../../services/http';

export interface HealthResponse {
  status: string;
  database: string;
  mysqlVersion?: string;
}

export function fetchHealth() {
  return request<HealthResponse>('/api/health');
}

export interface DashboardSummary {
  roleCount: number;
  permissionCount: number;
  riskRuleCount: number;
  pendingApplicationCount: number;
  openRiskReportCount: number;
  mediaFileCount: number;
  productCount: number;
}

export function fetchDashboardSummary() {
  return request<DashboardSummary>('/api/dashboard/summary');
}

