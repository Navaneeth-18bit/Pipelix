import { Database, Server, HardDrive, Clock } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { dbInfo, dbTables } from '@/data/sampleData';

export default function DatabasePage() {
  return (
    <div className="space-y-6">
      {/* Connection Info */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-600/15 border border-accent-600/30">
            <Database size={20} className="text-accent-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-ink-50">PostgreSQL</h3>
              <StatusBadge status="SUCCESS" />
            </div>
            <p className="text-xs text-ink-400 mt-0.5">Connection established</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database size={14} className="text-ink-400" />
              <span className="text-xs text-ink-400">Database</span>
            </div>
            <p className="text-sm font-semibold text-ink-100 font-mono">{dbInfo.name}</p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server size={14} className="text-ink-400" />
              <span className="text-xs text-ink-400">Host</span>
            </div>
            <p className="text-sm font-semibold text-ink-100 font-mono">{dbInfo.host}</p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive size={14} className="text-ink-400" />
              <span className="text-xs text-ink-400">Port</span>
            </div>
            <p className="text-sm font-semibold text-ink-100 font-mono">{dbInfo.port}</p>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="card p-5 animate-slide-up">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-ink-100">Database Tables</h3>
          <p className="text-xs text-ink-400 mt-0.5">Tables in the pipelix_db schema</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700">
                <th className="py-3 px-3 text-left font-semibold text-ink-400">Table Name</th>
                <th className="py-3 px-3 text-right font-semibold text-ink-400">Row Count</th>
                <th className="py-3 px-3 text-left font-semibold text-ink-400">Last Updated</th>
                <th className="py-3 px-3 text-center font-semibold text-ink-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {dbTables.map((table) => (
                <tr key={table.name} className="border-b border-ink-800 table-row-hover">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <Database size={14} className="text-ink-500" />
                      <span className="font-mono text-xs text-ink-100">{table.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-ink-200 font-semibold">{table.rowCount}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-ink-400">
                      <Clock size={12} />
                      <span className="text-xs">{table.lastUpdated}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={table.status} />
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
