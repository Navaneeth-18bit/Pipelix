import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Loader2,
  Play,
  Sparkles,
  XCircle,
} from 'lucide-react';
import ChartCard from '@/components/ChartCard';
import StatusBadge from '@/components/StatusBadge';
import DataTable, { type Column } from '@/components/DataTable';
import Drawer from '@/components/Drawer';
import PipelineTimeline from '@/components/PipelineTimeline';
import LoadingState from '@/components/LoadingState';
import ErrorBanner from '@/components/ErrorBanner';
import { fetchPipelines, fetchPipelineStages } from '@/api/pipelines';
import { fetchDashboardThroughput, type ThroughputItem } from '@/api/dashboard';
import type { PipelineRun, PipelineStage, PipelineStatus, TimelineStage } from '@/data/sampleData';
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

const defaultProgram = `pipeline: transactions
source: data/raw/fluxora_transactions.csv
steps: ingest, validate, transform, anomaly_detection, load`;

function analyzeProgram(program: string, sampleRecords: string): {
  run: PipelineRun;
  stages: PipelineStage[];
} {
  const lines = program.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const pipelineName = lines.find((line) => line.toLowerCase().startsWith('pipeline:'))
    ?.split(':').slice(1).join(':').trim() || 'custom pipeline';
  const stepLine = lines.find((line) => line.toLowerCase().startsWith('steps:'))
    ?.split(':').slice(1).join(':') || '';
  const requestedSteps = stepLine.split(',').map((step) => step.trim()).filter(Boolean);
  const stepNames = requestedSteps.length > 0
    ? requestedSteps.map((step) => step.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()))
    : ['Ingestion', 'Validation', 'Transformation', 'Anomaly Detection', 'PostgreSQL'];
  const inputRows = sampleRecords.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const recordsIngested = inputRows.length > 1 ? inputRows.length - 1 : Math.max(1, lines.length * 12);
  const failedRecords = inputRows.filter((line) => /error|invalid|null|missing/i.test(line)).length;
  const anomalies = inputRows.filter((line) => /anomal|fraud|outlier|suspicious/i.test(line)).length;
  const recordsProcessed = Math.max(0, recordsIngested - failedRecords);
  const status: PipelineStatus = failedRecords > 0 ? 'WARNING' : 'SUCCESS';
  const durationSeconds = Math.max(3, stepNames.length * 2 + Math.ceil(recordsIngested / 100));
  const stages = stepNames.map((name, index) => ({
    name,
    status: index === 1 && failedRecords > 0 ? 'WARNING' : 'SUCCESS',
    duration: `${Math.max(1, Math.round(durationSeconds / stepNames.length))}.${index + 1}s`,
    records: index === 0 ? recordsIngested : recordsProcessed,
    errors: index === 1 ? failedRecords : 0,
  }));

  return {
    run: {
      runId: 'PREVIEW',
      pipeline: pipelineName,
      startTime: 'Not started',
      endTime: null,
      duration: `${durationSeconds}s est.`,
      recordsIngested,
      recordsProcessed,
      failedRecords,
      anomalies,
      status,
      errorMessage: failedRecords > 0 ? 'Input contains records that need validation.' : null,
    },
    stages,
  };
}

export default function PipelinesPage() {
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [pipelineThroughput, setPipelineThroughput] = useState<ThroughputItem[]>([]);
  const [pipelineTimeline, setPipelineTimeline] = useState<TimelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState(defaultProgram);
  const [sampleRecords, setSampleRecords] = useState('transaction_id,amount,status\nTX-1001,1250.50,completed\nTX-1002,980.00,completed');
  const [previewRun, setPreviewRun] = useState<PipelineRun | null>(null);
  const [previewStages, setPreviewStages] = useState<PipelineStage[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [runsRes, throughputRes] = await Promise.all([
        fetchPipelines(),
        fetchDashboardThroughput(),
      ]);
      setPipelineRuns(runsRes);
      setPipelineThroughput(throughputRes);
      if (runsRes.length > 0) {
        const stages = await fetchPipelineStages(Number(runsRes[0].runId.replace('#', '')));
        setPipelineStages(stages);
        setPipelineTimeline(stages.map((stage) => ({
          label: stage.name,
          detail: `${stage.records.toLocaleString()} records, ${stage.errors} errors`,
          time: stage.duration,
          status: stage.status,
        })));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAnalyze = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const preview = analyzeProgram(program, sampleRecords);
    setPreviewRun(preview.run);
    setPreviewStages(preview.stages);
    setPipelineStages(preview.stages);
    setPipelineTimeline(preview.stages.map((stage) => ({
      label: stage.name,
      detail: `${stage.records.toLocaleString()} records, ${stage.errors} errors`,
      time: stage.duration,
      status: stage.status,
    })));
  };

  if (loading) return <LoadingState message="Loading pipelines from PostgreSQL..." />;
  if (error) return <ErrorBanner message={error} onRetry={loadData} />;

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
      {/* Model-assisted input preview */}
      <div className="card p-5 animate-slide-up">
        <div className="flex flex-col gap-1 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-400" />
            <h3 className="text-sm font-semibold text-ink-100">Try a pipeline input</h3>
            <span className="badge bg-accent-500/10 text-accent-300">Preview</span>
          </div>
          <p className="text-xs text-ink-400">Describe the program and paste sample rows. The model preview fills the operational columns before a run is started.</p>
        </div>
        <form onSubmit={handleAnalyze} className="grid gap-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-xs font-medium text-ink-300">Program or pipeline configuration</span>
            <textarea
              className="input min-h-32 w-full resize-y font-mono text-xs leading-5"
              value={program}
              onChange={(event) => setProgram(event.target.value)}
              placeholder="pipeline: orders\nsteps: ingest, validate, load"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-medium text-ink-300">Sample input rows (optional)</span>
            <textarea
              className="input min-h-32 w-full resize-y font-mono text-xs leading-5"
              value={sampleRecords}
              onChange={(event) => setSampleRecords(event.target.value)}
              placeholder="Paste CSV or log rows here"
            />
          </label>
          <button type="submit" className="btn btn-primary h-10 whitespace-nowrap">
            <Play size={15} />
            Analyze input
          </button>
        </form>
        {previewRun && (
          <div className="mt-5 overflow-x-auto rounded-lg border border-ink-700">
            <div className="flex items-center justify-between border-b border-ink-700 bg-ink-800/70 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-ink-100">Generated operation columns</p>
                <p className="text-xs text-ink-400">Estimated locally from the supplied program and rows</p>
              </div>
              <StatusBadge status={previewRun.status} />
            </div>
            <table className="min-w-full text-left text-xs">
              <thead className="bg-ink-800 text-ink-400">
                <tr>
                  {['Pipeline', 'Duration', 'Ingested', 'Processed', 'Failed', 'Anomalies', 'Status'].map((header) => (
                    <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-ink-200">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-100">{previewRun.pipeline}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono">{previewRun.duration}</td>
                  <td className="px-4 py-3">{previewRun.recordsIngested.toLocaleString()}</td>
                  <td className="px-4 py-3">{previewRun.recordsProcessed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-warning-400">{previewRun.failedRecords}</td>
                  <td className="px-4 py-3 text-ml-400">{previewRun.anomalies}</td>
                  <td className="px-4 py-3"><StatusBadge status={previewRun.status} /></td>
                </tr>
              </tbody>
            </table>
            <div className="border-t border-ink-700 px-4 py-3 text-xs text-ink-400">
              {previewStages.length} stages inferred. This preview does not write to PostgreSQL.
            </div>
          </div>
        )}
      </div>

      {/* Status banner */}
      <div className="card p-4 flex items-center gap-3 animate-slide-up">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-success-500" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-100">{pipelineRuns[0]?.status || 'No pipeline runs'}</p>
          <p className="text-xs text-ink-400">{pipelineRuns.length} runs loaded from PostgreSQL</p>
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
