import { apiClient } from './client';

export interface DashboardSummary {
  total_transactions: number;
  data_quality_score: number;
  anomalies: number;
  failed_records: number;
  pipeline_runs: number;
  pipeline_success_rate: number;
}

export interface ThroughputItem {
  time: string;
  records: number;
  anomalies: number;
}

export interface QualityTrendItem {
  run: string;
  quality: number;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiClient<DashboardSummary>('/api/dashboard/summary');
}

export async function fetchDashboardThroughput(): Promise<ThroughputItem[]> {
  return apiClient<ThroughputItem[]>('/api/dashboard/throughput');
}

export async function fetchDashboardTrends(): Promise<QualityTrendItem[]> {
  return apiClient<QualityTrendItem[]>('/api/dashboard/trends');
}
