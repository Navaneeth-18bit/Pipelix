import { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Activity, AlertTriangle } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable, { type Column } from '@/components/DataTable';
import Drawer from '@/components/Drawer';
import StatusBadge from '@/components/StatusBadge';
import {
  anomalyKpis,
  anomalies,
  normalScatter,
  formatINR,
  type AnomalyRecord,
} from '@/data/sampleData';

const distributionData = [
  { name: 'Normal', count: 9873, fill: '#3b82f6' },
  { name: 'Anomalous', count: 127, fill: '#8b5cf6' },
];

const scatterData = [
  ...normalScatter.map((p) => ({ ...p, type: 'normal' })),
  ...anomalies.map((a) => ({ amount: a.amount, score: a.score, id: a.transactionId, type: 'anomaly' })),
];

export default function AnomaliesPage() {
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(null);

  const kpisWithAccent: Array<'violet' | 'blue' | 'green' | 'amber'> = ['violet', 'blue', 'violet', 'amber'];

  const columns: Column<AnomalyRecord>[] = [
    {
      key: 'transactionId',
      header: 'Transaction ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-ink-100">{row.transactionId}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-semibold text-ink-100">{formatINR(row.amount)}</span>,
    },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-mono text-ml-400">{row.score}</span>,
    },
    {
      key: 'model',
      header: 'Model',
      render: (row) => <span className="text-ink-300">{row.model}</span>,
    },
    {
      key: 'version',
      header: 'Version',
      render: (row) => <span className="text-ink-400 font-mono text-xs">{row.version}</span>,
    },
    {
      key: 'detectedAt',
      header: 'Detected At',
      sortable: true,
      render: (row) => <span className="text-ink-300">{row.detectedAt}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const detailRows = selectedAnomaly
    ? [
        { label: 'Transaction ID', value: selectedAnomaly.transactionId },
        { label: 'Customer', value: selectedAnomaly.customer },
        { label: 'Product', value: selectedAnomaly.product },
        { label: 'Date', value: selectedAnomaly.date },
        { label: 'Quantity', value: String(selectedAnomaly.quantity) },
        { label: 'Unit Price', value: formatINR(selectedAnomaly.unitPrice) },
        { label: 'Total Amount', value: formatINR(selectedAnomaly.amount) },
        { label: 'Payment Method', value: selectedAnomaly.paymentMethod },
        { label: 'Location', value: selectedAnomaly.location },
        { label: 'Model', value: selectedAnomaly.model },
        { label: 'Version', value: selectedAnomaly.version },
        { label: 'Detected At', value: selectedAnomaly.detectedAt },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {anomalyKpis.map((kpi, i) => (
          <MetricCard key={i} metric={kpi} accent={kpisWithAccent[i]} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Bar Chart */}
        <ChartCard
          title="Anomaly Distribution"
          subtitle="Normal vs anomalous transaction volume"
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#22272f" horizontal={false} />
                <XAxis type="number" stroke="#525a66" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#525a66" fontSize={12} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13161c',
                    border: '1px solid #2a3038',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#9ba3af' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={36}>
                  {distributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Scatter Plot */}
        <ChartCard
          title="Transaction Amount vs Anomaly Score"
          subtitle="Anomalous transactions highlighted in violet"
          actions={<Activity size={16} className="text-ml-400" />}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#22272f" />
                <XAxis
                  type="number"
                  dataKey="amount"
                  name="Amount"
                  stroke="#525a66"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="number"
                  dataKey="score"
                  name="Score"
                  stroke="#525a66"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[-1, 0.5]}
                />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#13161c',
                    border: '1px solid #2a3038',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#9ba3af' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Amount') return [`₹${value.toLocaleString('en-IN')}`, name];
                    return [value, name];
                  }}
                />
                <Scatter data={scatterData.filter((p) => p.type === 'normal')} fill="#3b82f6" fillOpacity={0.4} />
                <Scatter data={scatterData.filter((p) => p.type === 'anomaly')} fill="#8b5cf6" fillOpacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Anomaly Table */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-ml-400" />
          <div>
            <h3 className="text-sm font-semibold text-ink-100">Detected Anomalies</h3>
            <p className="text-xs text-ink-400 mt-0.5">Unusual transaction patterns identified by the ML pipeline</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={anomalies}
          pageSize={8}
          onRowClick={(row) => setSelectedAnomaly(row)}
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        open={!!selectedAnomaly}
        onClose={() => setSelectedAnomaly(null)}
        title="Anomaly Details"
      >
        {selectedAnomaly && (
          <div className="space-y-5">
            <div className="rounded-lg border border-ml-500/20 bg-ml-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-ml-400" />
                <span className="text-sm font-semibold text-ml-400">Unusual Transaction</span>
              </div>
              <p className="text-xs text-ink-400">
                This transaction was flagged as an outlier by the Isolation Forest model. It is not necessarily fraudulent — it represents a statistical deviation from normal transaction patterns.
              </p>
            </div>

            <div className="space-y-2.5">
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">{row.label}</span>
                  <span className="font-medium text-ink-100 font-mono text-xs">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-700 pt-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                ML Analysis
              </h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Anomaly Score</span>
                <span className="font-mono text-sm font-semibold text-ml-400">{selectedAnomaly.score}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Status</span>
                <StatusBadge status={selectedAnomaly.status} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
