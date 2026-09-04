import { apiClient } from './client';

export interface HealthStatus {
  status: string;
  database: string;
}

export async function fetchHealth(): Promise<HealthStatus> {
  return apiClient<HealthStatus>('/api/health');
}
