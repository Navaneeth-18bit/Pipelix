import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { systemServices } from '@/data/sampleData';

function ServiceIcon({ status }: { status: string }) {
  switch (status) {
    case 'Connected':
    case 'Operational':
    case 'Available':
    case 'Running':
      return <CheckCircle2 size={20} className="text-success-400" />;
    case 'Degraded':
      return <AlertTriangle size={20} className="text-warning-400" />;
    case 'Down':
      return <XCircle size={20} className="text-danger-400" />;
    default:
      return <CheckCircle2 size={20} className="text-success-400" />;
  }
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'Degraded'
      ? 'bg-warning-500'
      : status === 'Down'
      ? 'bg-danger-500'
      : 'bg-success-500';

  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

export default function SystemPage() {
  const allOperational = systemServices.every(
    (s) => s.status === 'Connected' || s.status === 'Operational' || s.status === 'Available' || s.status === 'Running'
  );

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-3">
          <StatusDot status="Operational" />
          <div>
            <p className="text-base font-semibold text-ink-50">
              {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
            </p>
            <p className="text-xs text-ink-400 mt-0.5">
              {systemServices.length} services monitored
            </p>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemServices.map((service) => (
          <div key={service.name} className="card card-hover p-5 animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <ServiceIcon status={service.status} />
                <h3 className="text-sm font-semibold text-ink-100">{service.name}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={service.status} />
              <span className="text-xs font-medium text-ink-300">{service.status}</span>
            </div>
            <p className="mt-2 text-xs text-ink-400 font-mono">{service.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
