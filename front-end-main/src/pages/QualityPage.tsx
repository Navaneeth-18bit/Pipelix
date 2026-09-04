import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from '@/components/ChartCard';
import StatusBadge from '@/components/StatusBadge';
import QualityScore from '@/components/QualityScore';
import { qualityChecks, qualityTrend, type CheckStatus } from '@/data/sampleData';

const filters: ('All' | CheckStatus)[] = ['All', 'PASSED', 'WARNING', 'FAILED'];

export default function QualityPage() {
  const [activeFilter, setActiveFilter] = useState<'All' | CheckStatus>('All');

  const filteredChecks = activeFilter === 'All'
    ? qualityChecks
    : qualityChecks.filter((c) => c.status === activeFilter);

  const passedCount = qualityChecks.filter((c) => c.status === 'PASSED').length;
  const warningCount = qualityChecks.filter((c) => c.status === 'WARNING').length;
  const failedCount = qualityChecks.filter((c) => c.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Top row: Quality Score + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <ChartCard
          title="Data Quality Overview"
          subtitle="Overall quality score and record breakdown"
          className="lg:col-span-2"
        >
          <QualityScore />
        </ChartCard>

        <ChartCard
          title="Data Quality Trend"
          subtitle="Quality score across recent pipeline runs"
          className="lg:col-span-3"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22272f" vertical={false} />
                <XAxis dataKey="run" stroke="#525a66" fontSize={11} tickLine={false} axisLine={false} />
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
                <Line
                  type="monotone"
                  dataKey="quality"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Quality %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ink-400">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              {passedCount} passed
            </span>
            <span className="flex items-center gap-1.5 text-ink-400">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              {warningCount} warnings
            </span>
            <span className="flex items-center gap-1.5 text-ink-400">
              <span className="h-2 w-2 rounded-full bg-danger-500" />
              {failedCount} failed
            </span>
          </div>
        </ChartCard>
      </div>

      {/* Data Quality Checks Table */}
      <div className="card p-5 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-100">Data Quality Checks</h3>
            <p className="text-xs text-ink-400 mt-0.5">Validation results from the latest pipeline run</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-800 p-0.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === f
                    ? 'bg-ink-600 text-ink-50'
                    : 'text-ink-400 hover:text-ink-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700">
                <th className="py-3 px-3 text-left font-semibold text-ink-400">Check</th>
                <th className="py-3 px-3 text-left font-semibold text-ink-400">Column</th>
                <th className="py-3 px-3 text-right font-semibold text-ink-400">Issues</th>
                <th className="py-3 px-3 text-center font-semibold text-ink-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecks.map((check, i) => (
                <tr key={i} className="border-b border-ink-800 table-row-hover">
                  <td className="py-3 px-3 text-ink-200 font-medium">{check.check}</td>
                  <td className="py-3 px-3 text-ink-400 font-mono text-xs">{check.column}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-semibold ${check.issues > 0 ? 'text-warning-400' : 'text-success-400'}`}>
                      {check.issues}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={check.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
