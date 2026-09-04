import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
  GitBranch,
  TrendingUp,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import StatusBadge from '@/components/StatusBadge';
import {
  overviewKpis,
  pipelineThroughput,
  qualityTrend,
  anomalies,
  transactions,
} from '@/data/sampleData';

const anomalyDistribution = [
  { name: 'Normal', value: 9873, color: '#3b82f6' },
  { name: 'Anomalous', value: 127, color: '#8b5cf6' },
];

const recentAnomalies = anomalies.slice(0, 5);

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {overviewKpis.map((kpi, i) => {
          const accents: Array<'blue' | 'green' | 'amber' | 'red' | 'violet' | 'neutral'> = [
            'blue', 'green', 'violet', 'amber', 'blue', 'green',
          ];
          return <MetricCard key={i} metric={kpi} accent={accents[i]} />;
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Throughput */}
        <ChartCard
          title="Pipeline Throughput"
          subtitle="Records processed and anomalies detected over time"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineThroughput} barGap={4}>
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
                <Bar dataKey="records" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Records" />
                <Bar dataKey="anomalies" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Anomalies" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Quality Trend */}
        <ChartCard
          title="Data Quality Trend"
          subtitle="Quality score across recent pipeline runs"
          actions={<TrendingUp size={16} className="text-success-400" />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qualityTrend}>
                <defs>
                  <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#22272f" vertical={false} />
                <XAxis dataKey="run" stroke="#525a66" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525a66" fontSize={11} tickLine={false} axisLine={false} domain={[94, 100]} />
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
              <span className="font-semibold text-ink-100">9,873</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-300">
                <span className="h-2.5 w-2.5 rounded-full bg-ml-500" />
                Anomalous Transactions
              </span>
              <span className="font-semibold text-ink-100">127</span>
            </div>
          </div>
        </ChartCard>

        {/* Pipeline Status Summary */}
        <ChartCard
          title="Latest Pipeline Run"
          subtitle="Run #1042 — today at 10:30 AM"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-success-400" />
              <div>
                <p className="text-sm font-semibold text-ink-100">Pipeline Completed</p>
                <p className="text-xs text-ink-400">All stages succeeded</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Duration</p>
                <p className="text-sm font-bold text-ink-50">17s</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Records</p>
                <p className="text-sm font-bold text-ink-50">10,000</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Anomalies</p>
                <p className="text-sm font-bold text-ml-400">127</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-2.5">
                <p className="text-xs text-ink-400">Failed</p>
                <p className="text-sm font-bold text-warning-400">50</p>
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
            {recentAnomalies.map((a) => (
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
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
