import { apiClient } from './client';
import type { PipelineRun, PipelineStage } from '@/data/sampleData';

export async function fetchPipelines(): Promise<PipelineRun[]> {
  return apiClient<PipelineRun[]>('/api/pipelines');
}

export async function fetchPipelineDetails(runId: number): Promise<PipelineRun> {
  return apiClient<PipelineRun>(`/api/pipelines/${runId}`);
}

export async function fetchPipelineStages(runId: number): Promise<PipelineStage[]> {
  return apiClient<PipelineStage[]>(`/api/pipelines/${runId}/stages`);
}
