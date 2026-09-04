import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  GitBranch,
  Loader2,
  XCircle,
} from 'lucide-react';
import ChartCard from '@/components/ChartCard';
import StatusBadge from '@/components/StatusBadge';
import DataTable, { type Column } from '@/components/DataTable';
import Drawer from '@/components/Drawer';
import PipelineTimeline from '@/components/PipelineTimeline';
import {
  pipelineStages,
  pipelineRuns,
  pipelineTimeline,
  pipelineThroughput,
  type PipelineRun,
  type PipelineStage,
} from '@/data/sampleData';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function StageIcon({ status }: { status: string }) {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle2 size={20} className="text-success-400" />;
    case 'FAILED':
      return <XCircle size={20} className="text-danger-400" />;
    case 'RUNNING':
      return <Loader2 size={20} className="text-accent-400 animate-spin" />;
    default:
      return <CheckCircle2 size={20} className="text-success-400" />;
  }
}

export default function PipelinesPage() {
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);

  const columns: Column<PipelineRun>[] = [
    {
      key: 'runId',
      header: 'Run ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-ink-100">{row.runId}</span>,
    },
    {
      key: 'pipeline',
      header: 'Pipeline',
      render: (row) => <span className="text-ink-300">{row.pipeline}</span>,
    },
    {
      key: 'startTime',
      header: 'Start Time',
      sortable: true,
      render: (row) => <span className="text-ink-300 font-mono text-xs">{row.startTime}</span>,
    },
    {
      key: 'endTime',
      header: 'End Time',
      render: (row) => <span className="text-ink-300 font-mono text-xs">{row.endTime}</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      align: 'right',
      render: (row) => <span className="text-ink-200">{row.duration}</span>,
    },
    {
      key: 'recordsIngested',
      header: 'Ingested',
      sortable: true,
      align: 'right',
      render: (row) => <span className="text-ink-200">{row.recordsIngested.toLocaleString()}</span>,
    },
    {
      key: 'recordsProcessed',
      header: 'Processed',
      sortable: true,
      align: 'right',
      render: (row) => <span className="text-ink-200">{row.recordsProcessed.toLocaleString()}</span>,
    },
    {
      key: 'failedRecords',
      header: 'Failed',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className={row.failedRecords > 0 ? 'text-warning-400' : 'text-success-400'}>
          {row.failedRecords}
        </span>
      ),
    },
    {
      key: 'anomalies',
      header: 'Anomalies',
      sortable: true,
      align: 'right',
      render: (row) => <span className="text-ml-400">{row.anomalies}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="card p-4 flex items-center gap-3 animate-slide-up">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-success-500" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-100">Pipeline Operational</p>
          <p className="text-xs text-ink-400">All pipeline stages are running normally</p>
        </div>
      </div>

      {/* Execution Flow Diagram */}
      <ChartCard
        title="Pipeline Execution Flow"
        subtitle="Current pipeline stage statuses and performance"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 overflow-x-auto pb-2">
          {pipelineStages.map((stage: PipelineStage, i) => (
            <div key={stage.name} className="flex items-center gap-2 shrink-0">
              <div className="card p-3 min-w-[140px]">
                <div className="flex items-center gap-2 mb-2">
                  <StageIcon status={stage.status} />
                  <span className="text-xs font-semibold text-ink-100">{stage.name}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-400">Duration</span>
                    <span className="text-ink-200 font-mono">{stage.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Records</span>
                    <span className="text-ink-200">{stage.records.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Errors</span>
                    <span className={stage.errors > 0 ? 'text-warning-400' : 'text-success-400'}>
                      {stage.errors}
                    </span>
                  </div>
                </div>
              </div>
              {i < pipelineStages.length - 1 && (
                <ArrowRight size={16} className="text-ink-500 shrink-0 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Throughput Chart */}
      <ChartCard
        title="Pipeline Throughput"
        subtitle="Records processed per run over the last 7 hours"
      >
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pipelineThroughput}>
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="records"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#throughputGrad)"
                name="Records"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Pipeline Runs Table */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={16} className="text-accent-400" />
          <div>
            <h3 className="text-sm font-semibold text-ink-100">Pipeline Runs</h3>
            <p className="text-xs text-ink-400 mt-0.5">Execution history — click a row for details</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={pipelineRuns}
          pageSize={8}
          onRowClick={(row) => setSelectedRun(row)}
        />
      </div>

      {/* Run Details Drawer */}
      <Drawer
        open={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        title="Pipeline Run Details"
      >
        {selectedRun && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Run ID</p>
                <p className="text-sm font-bold text-ink-50 font-mono">{selectedRun.runId}</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Status</p>
                <div className="mt-1"><StatusBadge status={selectedRun.status} size="md" /></div>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Pipeline</p>
                <p className="text-sm font-bold text-ink-50">{selectedRun.pipeline}</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Duration</p>
                <p className="text-sm font-bold text-ink-50">{selectedRun.duration}</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Records Ingested</p>
                <p className="text-sm font-bold text-ink-50">{selectedRun.recordsIngested.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Records Processed</p>
                <p className="text-sm font-bold text-ink-50">{selectedRun.recordsProcessed.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Failed Records</p>
                <p className="text-sm font-bold text-warning-400">{selectedRun.failedRecords}</p>
              </div>
              <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
                <p className="text-xs text-ink-400">Anomalies</p>
                <p className="text-sm font-bold text-ml-400">{selectedRun.anomalies}</p>
              </div>
            </div>

            <div className="border-t border-ink-700 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-4">
                Execution Timeline
              </h4>
              <PipelineTimeline stages={pipelineTimeline} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
