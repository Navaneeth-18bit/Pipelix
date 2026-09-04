import {
  Activity,
  Database,
  Gauge,
  GitBranch,
  Search,
  Settings,
  ShieldCheck,
  Table2,
  X,
} from 'lucide-react';
import type { PageKey } from '@/data/sampleData';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: <Gauge size={18} /> },
  { key: 'quality', label: 'Data Quality', icon: <ShieldCheck size={18} /> },
  { key: 'transactions', label: 'Transactions', icon: <Table2 size={18} /> },
  { key: 'anomalies', label: 'Anomalies', icon: <Activity size={18} /> },
  { key: 'pipelines', label: 'Pipelines', icon: <GitBranch size={18} /> },
];

const systemNav: NavItem[] = [
  { key: 'database', label: 'Database', icon: <Database size={18} /> },
  { key: 'system', label: 'System', icon: <Activity size={18} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 border-r border-ink-700 bg-ink-900 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-ink-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600 text-white">
              <GitBranch size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-ink-50 leading-none">Pipelix</h1>
              <p className="text-[11px] text-ink-400 mt-0.5">Intelligent Data Platform</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-ink-400 hover:text-ink-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Monitoring
            </p>
            <ul className="space-y-1">
              {mainNav.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => onNavigate(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      current === item.key
                        ? 'bg-accent-600/15 text-accent-400 border border-accent-600/30'
                        : 'text-ink-300 hover:text-ink-50 hover:bg-ink-800 border border-transparent'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              System
            </p>
            <ul className="space-y-1">
              {systemNav.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => onNavigate(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      current === item.key
                        ? 'bg-accent-600/15 text-accent-400 border border-accent-600/30'
                        : 'text-ink-300 hover:text-ink-50 hover:bg-ink-800 border border-transparent'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Pipeline Status */}
        <div className="border-t border-ink-700 p-4">
          <div className="card p-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink-100">Pipeline Status</p>
                <p className="text-[11px] text-success-400">Operational</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
