import { apiClient } from './client';
import type { Transaction, TxnStatus } from '@/data/sampleData';

export interface PaginatedTransactions {
  data: Transaction[];
  page: int;
  limit: int;
  total: int;
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
