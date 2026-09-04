import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { KpiMetric } from '@/data/sampleData';

interface MetricCardProps {
  metric: KpiMetric;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'neutral';
}

const accentMap: Record<string, string> = {
  blue: 'text-accent-400',
  green: 'text-success-400',
  amber: 'text-warning-400',
  red: 'text-danger-400',
  violet: 'text-ml-400',
  neutral: 'text-ink-300',
};

export default function MetricCard({ metric, accent = 'neutral' }: MetricCardProps) {
  const TrendIcon =
    metric.trend === 'up' ? ArrowUpRight : metric.trend === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    metric.trend === 'up'
      ? 'text-success-400'
      : metric.trend === 'down'
      ? 'text-danger-400'
      : 'text-ink-400';

  return (
    <div className="card card-hover p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-300">{metric.label}</p>
        {metric.trend && metric.trendValue && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={14} />
            {metric.trendValue}
          </span>
        )}
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${accentMap[accent]}`}>
        {metric.value}
      </p>
      <p className="mt-1.5 text-xs text-ink-400">{metric.supporting}</p>
    </div>
  );
}
