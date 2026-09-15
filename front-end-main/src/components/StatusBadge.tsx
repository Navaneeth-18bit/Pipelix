import type { CheckStatus, PipelineStatus, AnomalyStatus } from '@/data/sampleData';

type BadgeVariant = CheckStatus | PipelineStatus | AnomalyStatus | 'HEALTHY' | 'STALE' | 'ERROR' | 'VALID' | 'INVALID' | 'ANOMALY';

interface StatusBadgeProps {
  status: BadgeVariant | string;
  size?: 'sm' | 'md';
}

const config: Record<string, { color: string; dot: string }> = {
  PASSED: { color: 'bg-success-500/10 text-success-400 border border-success-500/20', dot: 'bg-success-500' },
  WARNING: { color: 'bg-warning-500/10 text-warning-400 border border-warning-500/20', dot: 'bg-warning-500' },
  FAILED: { color: 'bg-danger-500/10 text-danger-400 border border-danger-500/20', dot: 'bg-danger-500' },
  RUNNING: { color: 'bg-accent-500/10 text-accent-400 border border-accent-500/20', dot: 'bg-accent-500' },
  SUCCESS: { color: 'bg-success-500/10 text-success-400 border border-success-500/20', dot: 'bg-success-500' },
  ANOMALY: { color: 'bg-ml-500/10 text-ml-400 border border-ml-500/20', dot: 'bg-ml-500' },
  REVIEWED: { color: 'bg-warning-500/10 text-warning-400 border border-warning-500/20', dot: 'bg-warning-500' },
  RESOLVED: { color: 'bg-success-500/10 text-success-400 border border-success-500/20', dot: 'bg-success-500' },
  HEALTHY: { color: 'bg-success-500/10 text-success-400 border border-success-500/20', dot: 'bg-success-500' },
  STALE: { color: 'bg-warning-500/10 text-warning-400 border border-warning-500/20', dot: 'bg-warning-500' },
  ERROR: { color: 'bg-danger-500/10 text-danger-400 border border-danger-500/20', dot: 'bg-danger-500' },
  VALID: { color: 'bg-success-500/10 text-success-400 border border-success-500/20', dot: 'bg-success-500' },
  INVALID: { color: 'bg-danger-500/10 text-danger-400 border border-danger-500/20', dot: 'bg-danger-500' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const c = config[status] ?? config.WARNING;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold tracking-wide uppercase ${c.color} ${sizeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
