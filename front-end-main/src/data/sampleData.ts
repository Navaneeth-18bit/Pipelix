export type PageKey =
  | 'overview'
  | 'quality'
  | 'transactions'
  | 'anomalies'
  | 'pipelines'
  | 'database'
  | 'system'
  | 'settings';

export type CheckStatus = 'PASSED' | 'WARNING' | 'FAILED';
export type PipelineStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'WARNING';
export type AnomalyStatus = 'ANOMALOUS' | 'NORMAL' | 'REVIEWED' | 'OPEN';
export type TxnStatus = string;

export interface KpiMetric {
  label: string;
  value: string;
  supporting: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  productId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  location: string;
  status: string;
  anomalyScore?: number | null;
}

export interface AnomalyRecord {
  id?: number;
  transactionId: string;
  customer: string;
  product: string;
  date: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  paymentMethod: string;
  location: string;
  score: number;
  model: string;
  version: string;
  detectedAt: string;
  status: string;
}

export interface PipelineRun {
  runId: string;
  pipeline: string;
  startTime: string;
  endTime?: string | null;
  duration: string;
  recordsIngested: number;
  recordsProcessed: number;
  failedRecords: number;
  anomalies: number;
  status: string;
  errorMessage?: string | null;
}

export interface PipelineStage {
  name: string;
  status: string;
  duration: string;
  records: number;
  errors: number;
}

export interface TimelineStage {
  label: string;
  detail: string;
  time: string;
  status: string;
}

export interface QualityCheck {
  check: string;
  column: string;
  issues: number;
  status: CheckStatus;
  tableName?: string;
  qualityScore?: number;
  createdAt?: string;
}

export interface DbTable {
  name: string;
  rowCount: string;
  lastUpdated: string;
  status: string;
}

export function formatINR(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
