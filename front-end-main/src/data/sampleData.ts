// ── Types ──────────────────────────────────────────────────────────────────

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
export type PipelineStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';
export type TxnStatus = 'VALID' | 'INVALID' | 'ANOMALY';
export type AnomalyStatus = 'ANOMALY' | 'REVIEWED' | 'RESOLVED';

export interface QualityCheck {
  check: string;
  column: string;
  issues: number;
  status: CheckStatus;
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
  status: TxnStatus;
  anomalyScore: number | null;
}

export interface AnomalyRecord {
  transactionId: string;
  amount: number;
  score: number;
  model: string;
  version: string;
  detectedAt: string;
  status: AnomalyStatus;
  customer: string;
  product: string;
  date: string;
  quantity: number;
  unitPrice: number;
  paymentMethod: string;
  location: string;
}

export interface PipelineRun {
  runId: string;
  pipeline: string;
  startTime: string;
  endTime: string;
  duration: string;
  recordsIngested: number;
  recordsProcessed: number;
  failedRecords: number;
  anomalies: number;
  status: PipelineStatus;
}

export interface PipelineStage {
  name: string;
  status: PipelineStatus;
  duration: string;
  records: number;
  errors: number;
}

export interface TimelineStage {
  label: string;
  detail: string;
  time: string;
  status: PipelineStatus;
}

export interface DbTable {
  name: string;
  rowCount: string;
  lastUpdated: string;
  status: 'HEALTHY' | 'STALE' | 'ERROR';
}

export interface SystemService {
  name: string;
  status: 'Connected' | 'Operational' | 'Available' | 'Running' | 'Degraded' | 'Down';
  detail: string;
}

export interface KpiMetric {
  label: string;
  value: string;
  supporting: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

// ── Overview KPIs ───────────────────────────────────────────────────────────

export const overviewKpis: KpiMetric[] = [
  { label: 'Total Transactions', value: '10,000', supporting: 'Processed records', trend: 'up', trendValue: '+3.2%' },
  { label: 'Data Quality Score', value: '98.4%', supporting: '+1.2% from previous run', trend: 'up', trendValue: '+1.2%' },
  { label: 'Anomalies Detected', value: '127', supporting: 'Detected by ML model', trend: 'down', trendValue: '-8' },
  { label: 'Failed Records', value: '84', supporting: 'Validation failures', trend: 'up', trendValue: '+12' },
  { label: 'Pipeline Runs', value: '42', supporting: 'Total executions', trend: 'up', trendValue: '+5' },
  { label: 'Pipeline Success Rate', value: '97.6%', supporting: 'Successful pipeline runs', trend: 'up', trendValue: '+0.3%' },
];

// ── Data Quality ────────────────────────────────────────────────────────────

export const qualityScore = 98.4;
export const validRecords = 9840;
export const invalidRecords = 160;

export const qualityBreakdown = [
  { label: 'Missing Values', value: 12 },
  { label: 'Duplicate Records', value: 8 },
  { label: 'Invalid Dates', value: 0 },
  { label: 'Invalid Numeric', value: 4 },
];

export const qualityChecks: QualityCheck[] = [
  { check: 'Missing Values', column: 'unit_price', issues: 12, status: 'WARNING' },
  { check: 'Duplicate IDs', column: 'transaction_id', issues: 8, status: 'WARNING' },
  { check: 'Invalid Quantity', column: 'quantity', issues: 4, status: 'FAILED' },
  { check: 'Invalid Dates', column: 'transaction_date', issues: 0, status: 'PASSED' },
  { check: 'Invalid Payment', column: 'payment_method', issues: 2, status: 'WARNING' },
  { check: 'Null Customer', column: 'customer_id', issues: 0, status: 'PASSED' },
  { check: 'Negative Amount', column: 'total_amount', issues: 3, status: 'FAILED' },
  { check: 'Schema Validation', column: 'all_columns', issues: 0, status: 'PASSED' },
];

export const qualityTrend = [
  { run: 'Run #1035', quality: 95.2 },
  { run: 'Run #1036', quality: 96.1 },
  { run: 'Run #1037', quality: 95.8 },
  { run: 'Run #1038', quality: 97.0 },
  { run: 'Run #1039', quality: 96.5 },
  { run: 'Run #1040', quality: 97.8 },
  { run: 'Run #1041', quality: 98.0 },
  { run: 'Run #1042', quality: 98.4 },
];

// ── Transactions ────────────────────────────────────────────────────────────

export const transactions: Transaction[] = [
  { id: 'TXN-10231', customerId: 'CUST-0451', productId: 'PRD-1023', date: '2026-09-04', quantity: 3, unitPrice: 1250, totalAmount: 3750, paymentMethod: 'Credit Card', location: 'Mumbai', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10232', customerId: 'CUST-0892', productId: 'PRD-0455', date: '2026-09-04', quantity: 1, unitPrice: 48500, totalAmount: 48500, paymentMethod: 'Bank Transfer', location: 'Delhi', status: 'ANOMALY', anomalyScore: -0.82 },
  { id: 'TXN-10233', customerId: 'CUST-0317', productId: 'PRD-0789', date: '2026-09-04', quantity: 2, unitPrice: 850, totalAmount: 1700, paymentMethod: 'UPI', location: 'Bangalore', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10234', customerId: 'CUST-0567', productId: 'PRD-1023', date: '2026-09-04', quantity: 1, unitPrice: 48500, totalAmount: 48500, paymentMethod: 'Bank Transfer', location: 'Delhi', status: 'ANOMALY', anomalyScore: -0.82 },
  { id: 'TXN-10235', customerId: 'CUST-0204', productId: 'PRD-0331', date: '2026-09-03', quantity: 5, unitPrice: 320, totalAmount: 1600, paymentMethod: 'Credit Card', location: 'Chennai', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10236', customerId: 'CUST-0789', productId: 'PRD-0567', date: '2026-09-03', quantity: 10, unitPrice: 12000, totalAmount: 120000, paymentMethod: 'Bank Transfer', location: 'Pune', status: 'ANOMALY', anomalyScore: -0.91 },
  { id: 'TXN-10237', customerId: 'CUST-0145', productId: 'PRD-0892', date: '2026-09-03', quantity: 1, unitPrice: 450, totalAmount: 450, paymentMethod: 'UPI', location: 'Hyderabad', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10238', customerId: 'CUST-0623', productId: 'PRD-0201', date: '2026-09-03', quantity: 2, unitPrice: 2200, totalAmount: 4400, paymentMethod: 'Credit Card', location: 'Kolkata', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10239', customerId: 'CUST-0918', productId: 'PRD-0331', date: '2026-09-03', quantity: 0, unitPrice: 320, totalAmount: 0, paymentMethod: 'UPI', location: 'Mumbai', status: 'INVALID', anomalyScore: null },
  { id: 'TXN-10240', customerId: 'CUST-0451', productId: 'PRD-1023', date: '2026-09-02', quantity: 4, unitPrice: 1250, totalAmount: 5000, paymentMethod: 'Credit Card', location: 'Mumbai', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10241', customerId: 'CUST-0344', productId: 'PRD-0789', date: '2026-09-02', quantity: 7, unitPrice: 850, totalAmount: 5950, paymentMethod: 'Debit Card', location: 'Bangalore', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10242', customerId: 'CUST-0567', productId: 'PRD-0455', date: '2026-09-02', quantity: 1, unitPrice: 52000, totalAmount: 52000, paymentMethod: 'Bank Transfer', location: 'Delhi', status: 'ANOMALY', anomalyScore: -0.88 },
  { id: 'TXN-10243', customerId: 'CUST-0892', productId: 'PRD-0567', date: '2026-09-02', quantity: 15, unitPrice: 12000, totalAmount: 180000, paymentMethod: 'Bank Transfer', location: 'Pune', status: 'ANOMALY', anomalyScore: -0.93 },
  { id: 'TXN-10244', customerId: 'CUST-0204', productId: 'PRD-0331', date: '2026-09-01', quantity: 3, unitPrice: 320, totalAmount: 960, paymentMethod: 'UPI', location: 'Chennai', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10245', customerId: 'CUST-0317', productId: 'PRD-0892', date: '2026-09-01', quantity: 2, unitPrice: 450, totalAmount: 900, paymentMethod: 'UPI', location: 'Hyderabad', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10246', customerId: 'CUST-0623', productId: 'PRD-0201', date: '2026-09-01', quantity: 1, unitPrice: 2200, totalAmount: 2200, paymentMethod: 'Credit Card', location: 'Kolkata', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10247', customerId: 'CUST-0145', productId: 'PRD-0567', date: '2026-09-01', quantity: 8, unitPrice: 12000, totalAmount: 96000, paymentMethod: 'Bank Transfer', location: 'Pune', status: 'ANOMALY', anomalyScore: -0.89 },
  { id: 'TXN-10248', customerId: 'CUST-0918', productId: 'PRD-1023', date: '2026-08-31', quantity: 2, unitPrice: 1250, totalAmount: 2500, paymentMethod: 'Credit Card', location: 'Mumbai', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10249', customerId: 'CUST-0789', productId: 'PRD-0789', date: '2026-08-31', quantity: 1, unitPrice: 850, totalAmount: 850, paymentMethod: 'UPI', location: 'Bangalore', status: 'VALID', anomalyScore: null },
  { id: 'TXN-10250', customerId: 'CUST-0344', productId: 'PRD-0455', date: '2026-08-31', quantity: 1, unitPrice: 51000, totalAmount: 51000, paymentMethod: 'Bank Transfer', location: 'Delhi', status: 'ANOMALY', anomalyScore: -0.87 },
];

// ── Anomalies ───────────────────────────────────────────────────────────────

export const anomalyKpis = [
  { label: 'Total Anomalies', value: '127', supporting: 'Across all transactions' },
  { label: 'Anomaly Rate', value: '1.27%', supporting: '127 of 10,000 transactions' },
  { label: 'Avg Anomaly Score', value: '-0.84', supporting: 'Lower = more unusual' },
  { label: 'Latest Detection', value: '10:32 AM', supporting: 'Run #1042, today' },
];

export const anomalies: AnomalyRecord[] = [
  { transactionId: 'TXN-10234', amount: 48500, score: -0.82, model: 'Isolation Forest', version: 'v1.0', detectedAt: '10:32 AM', status: 'ANOMALY', customer: 'CUST-0567', product: 'PRD-1023', date: '2026-09-04', quantity: 1, unitPrice: 48500, paymentMethod: 'Bank Transfer', location: 'Delhi' },
  { transactionId: 'TXN-10236', amount: 120000, score: -0.91, model: 'Isolation Forest', version: 'v1.0', detectedAt: '10:32 AM', status: 'ANOMALY', customer: 'CUST-0789', product: 'PRD-0567', date: '2026-09-03', quantity: 10, unitPrice: 12000, paymentMethod: 'Bank Transfer', location: 'Pune' },
  { transactionId: 'TXN-10242', amount: 52000, score: -0.88, model: 'Isolation Forest', version: 'v1.0', detectedAt: '10:30 AM', status: 'ANOMALY', customer: 'CUST-0567', product: 'PRD-0455', date: '2026-09-02', quantity: 1, unitPrice: 52000, paymentMethod: 'Bank Transfer', location: 'Delhi' },
  { transactionId: 'TXN-10243', amount: 180000, score: -0.93, model: 'Isolation Forest', version: 'v1.0', detectedAt: '10:30 AM', status: 'REVIEWED', customer: 'CUST-0892', product: 'PRD-0567', date: '2026-09-02', quantity: 15, unitPrice: 12000, paymentMethod: 'Bank Transfer', location: 'Pune' },
  { transactionId: 'TXN-10247', amount: 96000, score: -0.89, model: 'Isolation Forest', version: 'v1.0', detectedAt: '10:28 AM', status: 'ANOMALY', customer: 'CUST-0145', product: 'PRD-0567', date: '2026-09-01', quantity: 8, unitPrice: 12000, paymentMethod: 'Bank Transfer', location: 'Pune' },
  { transactionId: 'TXN-10250', amount: 51000, score: -0.87, model: 'Isolation Forest', version: 'v1.0', detectedAt: '10:26 AM', status: 'RESOLVED', customer: 'CUST-0344', product: 'PRD-0455', date: '2026-08-31', quantity: 1, unitPrice: 51000, paymentMethod: 'Bank Transfer', location: 'Delhi' },
  { transactionId: 'TXN-10232', amount: 48500, score: -0.82, model: 'Isolation Forest', version: 'v1.0', detectedAt: '10:25 AM', status: 'ANOMALY', customer: 'CUST-0892', product: 'PRD-0455', date: '2026-09-04', quantity: 1, unitPrice: 48500, paymentMethod: 'Bank Transfer', location: 'Delhi' },
  { transactionId: 'TXN-10219', amount: 75000, score: -0.85, model: 'Isolation Forest', version: 'v1.0', detectedAt: '09:45 AM', status: 'REVIEWED', customer: 'CUST-0623', product: 'PRD-0567', date: '2026-08-30', quantity: 6, unitPrice: 12500, paymentMethod: 'Bank Transfer', location: 'Kolkata' },
  { transactionId: 'TXN-10205', amount: 62000, score: -0.84, model: 'Isolation Forest', version: 'v1.0', detectedAt: '09:20 AM', status: 'ANOMALY', customer: 'CUST-0789', product: 'PRD-0455', date: '2026-08-30', quantity: 1, unitPrice: 62000, paymentMethod: 'Bank Transfer', location: 'Pune' },
  { transactionId: 'TXN-10198', amount: 95000, score: -0.90, model: 'Isolation Forest', version: 'v1.0', detectedAt: '08:50 AM', status: 'RESOLVED', customer: 'CUST-0204', product: 'PRD-0567', date: '2026-08-29', quantity: 7, unitPrice: 13571, paymentMethod: 'Bank Transfer', location: 'Chennai' },
];

// Scatter plot data: amount vs anomaly score
export const anomalyScatter = anomalies.map((a) => ({
  amount: a.amount,
  score: a.score,
  id: a.transactionId,
}));

// Normal transactions for scatter plot context
export const normalScatter = transactions
  .filter((t) => t.status === 'VALID')
  .map((t) => ({
    amount: t.totalAmount,
    score: 0.15 + Math.random() * 0.3,
    id: t.id,
  }));

// ── Pipelines ───────────────────────────────────────────────────────────────

export const pipelineStages: PipelineStage[] = [
  { name: 'Ingestion', status: 'SUCCESS', duration: '3.2s', records: 10000, errors: 0 },
  { name: 'Validation', status: 'SUCCESS', duration: '2.8s', records: 10000, errors: 50 },
  { name: 'Transformation', status: 'SUCCESS', duration: '4.1s', records: 9950, errors: 0 },
  { name: 'PostgreSQL', status: 'SUCCESS', duration: '3.5s', records: 9950, errors: 0 },
  { name: 'Feature Engineering', status: 'SUCCESS', duration: '2.2s', records: 9950, errors: 0 },
  { name: 'Anomaly Detection', status: 'SUCCESS', duration: '3.8s', records: 9950, errors: 0 },
];

export const pipelineRuns: PipelineRun[] = [
  { runId: '#1042', pipeline: 'main-pipeline', startTime: '10:30:02', endTime: '10:30:19', duration: '17s', recordsIngested: 10000, recordsProcessed: 9950, failedRecords: 50, anomalies: 127, status: 'SUCCESS' },
  { runId: '#1041', pipeline: 'main-pipeline', startTime: '09:00:01', endTime: '09:00:16', duration: '15s', recordsIngested: 8500, recordsProcessed: 8462, failedRecords: 38, anomalies: 98, status: 'SUCCESS' },
  { runId: '#1040', pipeline: 'batch-import', startTime: '08:00:05', endTime: '08:00:22', duration: '17s', recordsIngested: 12000, recordsProcessed: 11940, failedRecords: 60, anomalies: 145, status: 'SUCCESS' },
  { runId: '#1039', pipeline: 'main-pipeline', startTime: '07:00:02', endTime: '07:00:14', duration: '12s', recordsIngested: 7200, recordsProcessed: 7185, failedRecords: 15, anomalies: 76, status: 'SUCCESS' },
  { runId: '#1038', pipeline: 'realtime-stream', startTime: '06:00:00', endTime: '06:00:09', duration: '9s', recordsIngested: 3400, recordsProcessed: 3398, failedRecords: 2, anomalies: 31, status: 'SUCCESS' },
  { runId: '#1037', pipeline: 'batch-import', startTime: '05:00:03', endTime: '05:00:21', duration: '18s', recordsIngested: 15000, recordsProcessed: 14910, failedRecords: 90, anomalies: 162, status: 'FAILED' },
  { runId: '#1036', pipeline: 'main-pipeline', startTime: '04:00:01', endTime: '04:00:15', duration: '14s', recordsIngested: 9200, recordsProcessed: 9170, failedRecords: 30, anomalies: 89, status: 'SUCCESS' },
  { runId: '#1035', pipeline: 'realtime-stream', startTime: '03:00:00', endTime: '03:00:08', duration: '8s', recordsIngested: 2800, recordsProcessed: 2795, failedRecords: 5, anomalies: 24, status: 'SUCCESS' },
];

export const pipelineTimeline: TimelineStage[] = [
  { label: 'STARTED', detail: 'Pipeline execution initiated', time: '10:30:02', status: 'SUCCESS' },
  { label: 'INGESTION', detail: '10,000 records ingested', time: '10:30:05', status: 'SUCCESS' },
  { label: 'VALIDATION', detail: '9,950 valid / 50 invalid', time: '10:30:08', status: 'SUCCESS' },
  { label: 'TRANSFORMATION', detail: '9,950 records transformed', time: '10:30:11', status: 'SUCCESS' },
  { label: 'POSTGRESQL', detail: '9,950 records loaded', time: '10:30:15', status: 'SUCCESS' },
  { label: 'ANOMALY DETECTION', detail: '127 anomalies detected', time: '10:30:19', status: 'SUCCESS' },
  { label: 'COMPLETED', detail: 'Pipeline completed successfully', time: '10:30:19', status: 'SUCCESS' },
];

export const pipelineThroughput = [
  { time: '04:00', records: 9200, anomalies: 89 },
  { time: '05:00', records: 15000, anomalies: 162 },
  { time: '06:00', records: 3400, anomalies: 31 },
  { time: '07:00', records: 7200, anomalies: 76 },
  { time: '08:00', records: 12000, anomalies: 145 },
  { time: '09:00', records: 8500, anomalies: 98 },
  { time: '10:00', records: 10000, anomalies: 127 },
];

// ── Database ─────────────────────────────────────────────────────────────────

export const dbInfo = {
  name: 'pipelix_db',
  host: 'localhost',
  port: 5432,
  status: 'Connected' as const,
};

export const dbTables: DbTable[] = [
  { name: 'customers', rowCount: '5,420', lastUpdated: '2 min ago', status: 'HEALTHY' },
  { name: 'products', rowCount: '1,280', lastUpdated: '5 min ago', status: 'HEALTHY' },
  { name: 'transactions', rowCount: '10,000', lastUpdated: '1 min ago', status: 'HEALTHY' },
  { name: 'data_quality_logs', rowCount: '3,840', lastUpdated: '1 min ago', status: 'HEALTHY' },
  { name: 'anomalies', rowCount: '127', lastUpdated: '1 min ago', status: 'HEALTHY' },
  { name: 'pipeline_runs', rowCount: '42', lastUpdated: '1 min ago', status: 'HEALTHY' },
];

// ── System Health ────────────────────────────────────────────────────────────

export const systemServices: SystemService[] = [
  { name: 'PostgreSQL', status: 'Connected', detail: 'pipelix_db @ localhost:5432' },
  { name: 'ETL Pipeline', status: 'Operational', detail: 'Last run: 10:30 AM' },
  { name: 'ML Model', status: 'Available', detail: 'Isolation Forest v1.0' },
  { name: 'Airflow', status: 'Operational', detail: 'Scheduler running' },
  { name: 'Streamlit', status: 'Running', detail: 'Dashboard on port 8501' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const formatINR = (n: number): string =>
  '₹' + n.toLocaleString('en-IN');
