import { Menu, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  onRefresh?: () => void;
  showRangeFilter?: boolean;
}

const ranges = ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Custom'];

export default function Header({ title, subtitle, onMenuClick, onRefresh, showRangeFilter = true }: HeaderProps) {
  const [activeRange, setActiveRange] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-ink-300 hover:text-ink-50"
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ink-50 truncate">{title}</h2>
            <p className="text-sm text-ink-400 mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {showRangeFilter && (
            <div className="hidden sm:flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-800 p-0.5">
              {ranges.map((r, i) => (
                <button
                  key={r}
                  onClick={() => setActiveRange(i)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeRange === i
                      ? 'bg-ink-600 text-ink-50'
                      : 'text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="btn btn-outline"
            title="Refresh data"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
