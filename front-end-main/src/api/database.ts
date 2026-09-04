import { apiClient } from './client';
import type { DbTable } from '@/data/sampleData';

export interface DatabaseStatus {
  database: string;
  status: string;
  host: string;
  port: number;
}

export async function fetchDatabaseStatus(): Promise<DatabaseStatus> {
  return apiClient<DatabaseStatus>('/api/database/status');
}

export async function fetchDatabaseTables(): Promise<DbTable[]> {
  return apiClient<DbTable[]>('/api/database/tables');
}
