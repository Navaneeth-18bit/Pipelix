import { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import StatusBadge from '@/components/StatusBadge';
import LoadingState from '@/components/LoadingState';
import ErrorBanner from '@/components/ErrorBanner';
import {
  fetchDashboardSummary,
  fetchDashboardThroughput,
  fetchDashboardTrends,
  type DashboardSummary,
  type ThroughputItem,
  type QualityTrendItem,
} from '@/api/dashboard';
import { fetchAnomalies } from '@/api/anomalies';
import { fetchPipelines } from '@/api/pipelines';
import type { AnomalyRecord, PipelineRun, KpiMetric } from '@/data/sampleData';

export default function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [throughput, setThroughput] = useState<ThroughputItem[]>([]);
  const [trends, setTrends] = useState<QualityTrendItem[]>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<AnomalyRecord[]>([]);
  const [latestRun, setLatestRun] = useState<PipelineRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sumRes, tpRes, trRes, anomRes, pipeRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchDashboardThroughput(),
        fetchDashboardTrends(),
        fetchAnomalies({ limit: 5 }),
        fetchPipelines(),
      ]);

      setSummary(sumRes);
      setThroughput(tpRes);
      setTrends(trRes);
      setRecentAnomalies(anomRes.data);
      if (pipeRes.length > 0) {
        setLatestRun(pipeRes[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the Pipelix backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard overview from PostgreSQL..." />;
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <ErrorBanner message={error || 'Failed to load dashboard metrics'} onRetry={loadData} />
      </div>
    );
  }

  const kpis: KpiMetric[] = [
    {
      label: 'Total Transactions',
      value: summary.total_transactions.toLocaleString(),
      supporting: 'Processed database records',
      trend: 'up',
      trendValue: '+Live',
    },
    {
      label: 'Data Quality Score',
      value: `${summary.data_quality_score}%`,
      supporting: 'PostgreSQL validation score',
      trend: 'up',
      trendValue: '+Live',
    },
    {
      label: 'Anomalies Detected',
      value: summary.anomalies.toLocaleString(),
      supporting: 'Isolation Forest detections',
      trend: summary.anomalies > 0 ? 'down' : 'neutral',
      trendValue: summary.anomalies > 0 ? 'Review' : 'None',
    },
    {
      label: 'Failed Records',
      value: summary.failed_records.toLocaleString(),
      supporting: 'Validation check failures',
      trend: summary.failed_records > 0 ? 'down' : 'neutral',
      trendValue: String(summary.failed_records),
    },
    {
      label: 'Pipeline Runs',
      value: summary.pipeline_runs.toLocaleString(),
      supporting: 'Total pipeline executions',
      trend: 'up',
      trendValue: `${summary.pipeline_runs} runs`,
    },
    {
      label: 'Pipeline Success Rate',
      value: `${summary.pipeline_success_rate}%`,
      supporting: 'Successful pipeline executions',
      trend: 'up',
      trendValue: `${summary.pipeline_success_rate}%`,
    },
  ];

  const normalCount = Math.max(0, summary.total_transactions - summary.anomalies);
  const anomalyDistribution = [
    { name: 'Normal', value: normalCount, color: '#3b82f6' },
    { name: 'Anomalous', value: summary.anomalies, color: '#8b5cf6' },
  ];

  const accents: Array<'blue' | 'green' | 'amber' | 'red' | 'violet' | 'neutral'> = [
    'blue', 'green', 'violet', 'amber', 'blue', 'green',
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <MetricCard key={i} metric={kpi} accent={accents[i]} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Throughput */}
        <ChartCard
          title="Pipeline Throughput"
          subtitle="Records processed and anomalies detected over time"
        >
          <div className="h-64">
            {throughput.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={throughput} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22272f" vertical={false} />
                  <XAxis dataKey="time" stroke="#525a66" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525a66" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#13161c',
                      border: '1px solid #2a3038',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#9ba3af' }}
                  />
                  <Bar dataKey="records" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Records Ingested" />
                  <Bar dataKey="anomalies" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Anomalies Detected" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink-400">
                No throughput data recorded yet
              </div>
            )}
          </div>
        </ChartCard>

        {/* Quality Trend */}
        <ChartCard
          title="Data Quality Trend"
          subtitle="Quality score across recent pipeline runs"
          actions={<TrendingUp size={16} className="text-success-400" />}
        >
          <div className="h-64">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22272f" vertical={false} />
                  <XAxis dataKey="run" stroke="#525a66" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525a66" fontSize={11} tickLine={false} axisLine={false} domain={[80, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#13161c',
                      border: '1px solid #2a3038',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#9ba3af' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="quality"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#qualityGrad)"
                    name="Quality %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-ink-400">
                No quality logs available
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Distribution */}
        <ChartCard
          title="Anomaly Distribution"
          subtitle="Normal vs anomalous transactions"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={anomalyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {anomalyDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13161c',
                    border: '1px solid #2a3038',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#9ba3af' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-300">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
                Normal Transactions
              </span>
              <span className="font-semibold text-ink-100">{normalCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-300">
                <span className="h-2.5 w-2.5 rounded-full bg-ml-500" />
                Anomalous Transactions
              </span>
              <span className="font-semibold text-ink-100">{summary.anomalies.toLocaleString()}</span>
            </div>
          </div>
        </ChartCard>

        {/* Pipeline Status Summary */}
        <ChartCard
          title="Latest Pipeline Run"
          subtitle={latestRun ? `Run ${latestRun.runId} — ${latestRun.pipeline}` : 'No runs recorded'}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-success-400" />
              <div>
                <p className="text-sm font-semibold text-ink-100">
                  {latestRun ? `Status: ${latestRun.status}` : 'No active runs'}
                </p>
                <p className="text-xs text-ink-400">
                  {latestRun?.errorMessage || 'Pipeline executed successfully'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Duration</p>
                <p className="text-sm font-bold text-ink-50">{latestRun?.duration || '--'}</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Records</p>
                <p className="text-sm font-bold text-ink-50">
                  {latestRun ? latestRun.recordsIngested.toLocaleString() : '0'}
                </p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Anomalies</p>
                <p className="text-sm font-bold text-ml-400">
                  {latestRun ? latestRun.anomalies.toLocaleString() : '0'}
                </p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Failed</p>
                <p className="text-sm font-bold text-warning-400">
                  {latestRun ? latestRun.failedRecords.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Recent Anomalies */}
        <ChartCard
          title="Recent Anomalies"
          subtitle="Latest unusual transactions detected"
          actions={<Activity size={16} className="text-ml-400" />}
        >
          <div className="space-y-2.5">
            {recentAnomalies.length > 0 ? (
              recentAnomalies.map((a) => (
                <div key={a.transactionId} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-ink-200 truncate">{a.transactionId}</p>
                    <p className="text-xs text-ink-400 mt-0.5">Score: {a.score}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-ink-100">
                      ₹{a.amount.toLocaleString('en-IN')}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-400 py-4 text-center">No anomalies recorded</p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
