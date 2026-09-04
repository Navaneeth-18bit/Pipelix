import { apiClient } from './client';
import type { AnomalyRecord } from '@/data/sampleData';

export interface PaginatedAnomalies {
  data: AnomalyRecord[];
  page: number;
  limit: number;
  total: number;
}

export interface AnomalyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  minScore?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ScatterPoint {
  id: string;
  amount: number;
  score: number;
  type: 'anomaly' | 'normal';
}

export async function fetchAnomalies(params: AnomalyQueryParams = {}): Promise<PaginatedAnomalies> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.minScore !== undefined) query.append('min_score', String(params.minScore));
  if (params.sortBy) query.append('sort_by', params.sortBy);
  if (params.sortDir) query.append('sort_dir', params.sortDir);

  const qs = query.toString();
  return apiClient<PaginatedAnomalies>(`/api/anomalies${qs ? `?${qs}` : ''}`);
}

export async function fetchAnomalyDetails(anomalyId: number): Promise<AnomalyRecord> {
  return apiClient<AnomalyRecord>(`/api/anomalies/${anomalyId}`);
}

export async function fetchAnomalyScatter(): Promise<ScatterPoint[]> {
  return apiClient<ScatterPoint[]>('/api/anomalies/scatter');
}
