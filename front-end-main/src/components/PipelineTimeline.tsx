import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { TimelineStage } from '@/data/sampleData';

interface PipelineTimelineProps {
  stages: TimelineStage[];
  runId?: string;
}

function getStageIcon(status: string) {
  switch (status) {
    case 'SUCCESS':
      return <CheckCircle2 size={18} className="text-success-400" />;
    case 'FAILED':
      return <XCircle size={18} className="text-danger-400" />;
    case 'RUNNING':
      return <Loader2 size={18} className="text-accent-400 animate-spin" />;
    default:
      return <AlertCircle size={18} className="text-warning-400" />;
  }
}

export default function PipelineTimeline({ stages, runId }: PipelineTimelineProps) {
  return (
    <div className="relative">
      {runId && (
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-600/15 border border-accent-600/30">
            <span className="text-sm font-bold text-accent-400">#{runId.replace('#', '')}</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-50">Pipeline Run {runId}</h3>
            <p className="text-xs text-ink-400">Execution timeline</p>
          </div>
        </div>
      )}

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[14px] top-2 bottom-2 w-px bg-ink-700" />

        {stages.map((stage, i) => (
          <div key={i} className="relative pb-6 last:pb-0 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            {/* Node */}
            <div className="absolute -left-[26px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink-850 border border-ink-700">
              {getStageIcon(stage.status)}
            </div>

            {/* Content */}
            <div className="ml-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink-100">{stage.label}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{stage.detail}</p>
                </div>
                <span className="text-xs text-ink-500 font-mono whitespace-nowrap">{stage.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
