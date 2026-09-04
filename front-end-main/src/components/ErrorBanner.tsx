import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorBanner({
  message = 'Unable to connect to the Pipelix backend. Please check that the FastAPI backend (localhost:8000) and PostgreSQL database (localhost:5432) are running.',
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-5 animate-fade-in">
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger-500/20 text-danger-400">
          <AlertTriangle size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-danger-300">Connection Issue</h4>
          <p className="mt-1 text-xs text-ink-300 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-danger-500/20 text-danger-300 hover:bg-danger-500/30 transition-colors"
            >
              <RefreshCw size={12} />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
