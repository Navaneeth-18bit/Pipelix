import { apiClient } from './client';
import type { QualityCheck } from '@/data/sampleData';

export interface QualitySummary {
  overall_quality_score: number;
  valid_records: number;
  invalid_records: number;
  missing_values: number;
  duplicate_records: number;
  invalid_dates: number;
  invalid_numeric_values: number;
}

export interface QualityCheckItem extends QualityCheck {
  id?: number;
  tableName?: string;
  qualityScore?: number;
  createdAt?: string;
}

export async function fetchQualitySummary(): Promise<QualitySummary> {
  return apiClient<QualitySummary>('/api/quality/summary');
}

export async function fetchQualityChecks(status?: string, tableName?: string): Promise<QualityCheckItem[]> {
  const query = new URLSearchParams();
  if (status && status !== 'All') query.append('status', status);
  if (tableName && tableName !== 'All') query.append('table_name', tableName);

  const qs = query.toString();
  return apiClient<QualityCheckItem[]>(`/api/quality/checks${qs ? `?${qs}` : ''}`);
}
