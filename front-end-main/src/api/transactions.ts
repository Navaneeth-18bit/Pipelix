import { apiClient } from './client';
import type { Transaction } from '@/data/sampleData';

export interface PaginatedTransactions {
  data: Transaction[];
  page: number;
  limit: number;
  total: number;
}

export interface TransactionImportResult {
  status: 'imported' | 'rejected';
  filename: string;
  total_rows: number;
  imported_rows: number;
  rejected_rows: number;
  csv_saved_as?: string;
  processing_status?: 'completed' | 'failed';
  processing_error?: string | null;
  errors: Array<{ row?: number; message: string }>;
}

export interface TransactionDetails extends Transaction {
  customerName?: string;
  customerEmail?: string;
  productName?: string;
  productCategory?: string;
  anomalyDetails?: {
    anomaly_id: number;
    anomaly_score: number;
    is_anomaly: boolean;
    model_name: string;
    model_version: string;
    detected_at: string;
  } | null;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  paymentMethod?: string;
  location?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function fetchTransactions(params: TransactionQueryParams = {}): Promise<PaginatedTransactions> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.paymentMethod && params.paymentMethod !== 'All') query.append('payment_method', params.paymentMethod);
  if (params.location && params.location !== 'All') query.append('location', params.location);
  if (params.sortBy) query.append('sort_by', params.sortBy);
  if (params.sortDir) query.append('sort_dir', params.sortDir);

  const qs = query.toString();
  return apiClient<PaginatedTransactions>(`/api/transactions${qs ? `?${qs}` : ''}`);
}

export async function fetchTransactionDetails(id: string): Promise<TransactionDetails> {
  return apiClient<TransactionDetails>(`/api/transactions/${id}`);
}

export async function importTransactions(file: File): Promise<TransactionImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient<TransactionImportResult>('/api/transactions/import', {
    method: 'POST',
    body: formData,
  });
}
