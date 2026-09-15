import { useState } from 'react';
import { Settings, Bell, Shield, Palette, Trash2 } from 'lucide-react';
import { deleteAllDatabaseData } from '@/api/database';

export default function SettingsPage() {
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAllData = async () => {
    if (confirmation !== 'DELETE') return;

    try {
      setDeleting(true);
      setMessage(null);
      setError(null);
      const result = await deleteAllDatabaseData();
      setMessage(result.message);
      setConfirmation('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete database data');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-2.5 mb-4">
          <Settings size={18} className="text-ink-300" />
          <h3 className="text-sm font-semibold text-ink-100">General Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-ink-200 font-medium">Organization Name</label>
            <input type="text" defaultValue="Pipelix" className="input mt-1.5 w-full" />
          </div>
          <div>
            <label className="text-sm text-ink-200 font-medium">Data Refresh Interval</label>
            <select className="input mt-1.5 w-full">
              <option className="bg-ink-800">Every 30 seconds</option>
              <option className="bg-ink-800">Every 1 minute</option>
              <option className="bg-ink-800">Every 5 minutes</option>
              <option className="bg-ink-800">Manual only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-2.5 mb-4">
          <Bell size={18} className="text-ink-300" />
          <h3 className="text-sm font-semibold text-ink-100">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Pipeline failure alerts', desc: 'Get notified when a pipeline run fails', defaultChecked: true },
            { label: 'Anomaly detection alerts', desc: 'Get notified when new anomalies are detected', defaultChecked: true },
            { label: 'Data quality warnings', desc: 'Get notified when data quality drops below threshold', defaultChecked: false },
            { label: 'System health alerts', desc: 'Get notified when a service becomes unavailable', defaultChecked: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-200 font-medium">{item.label}</p>
                <p className="text-xs text-ink-400 mt-0.5">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                <div className="w-10 h-5 bg-ink-700 rounded-full peer peer-checked:bg-accent-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-ink-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 peer-checked:after:bg-white" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-2.5 mb-4">
          <Shield size={18} className="text-ink-300" />
          <h3 className="text-sm font-semibold text-ink-100">Security</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-200 font-medium">Two-factor authentication</p>
              <p className="text-xs text-ink-400 mt-0.5">Add an extra layer of security</p>
            </div>
            <button className="btn btn-outline">Configure</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-200 font-medium">API access tokens</p>
              <p className="text-xs text-ink-400 mt-0.5">Manage tokens for API access</p>
            </div>
            <button className="btn btn-outline">Manage</button>
          </div>
        </div>
      </div>

      <div className="card p-5 animate-slide-up">
        <div className="flex items-center gap-2.5 mb-4">
          <Palette size={18} className="text-ink-300" />
          <h3 className="text-sm font-semibold text-ink-100">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-200 font-medium">Theme</p>
            <p className="text-xs text-ink-400 mt-0.5">Dark mode is currently active</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-ink-900 border-2 border-accent-500" />
            <div className="h-8 w-8 rounded-lg bg-gray-100 border-2 border-transparent" />
          </div>
        </div>
      </div>

      <div className="card border border-red-900/60 p-5 animate-slide-up">
        <div className="flex items-center gap-2.5 mb-2">
          <Trash2 size={18} className="text-red-400" />
          <h3 className="text-sm font-semibold text-red-300">Danger Zone</h3>
        </div>
        <p className="text-xs text-ink-400 mb-4">
          Permanently delete customers, products, transactions, pipeline runs, quality logs, and anomalies.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs text-ink-400">Type DELETE to confirm</label>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="input mt-1.5 w-full"
              placeholder="DELETE"
              aria-label="Type DELETE to confirm database deletion"
            />
          </div>
          <button
            type="button"
            className="btn border border-red-700 bg-red-950/40 text-red-300 hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={confirmation !== 'DELETE' || deleting}
            onClick={handleDeleteAllData}
          >
            {deleting ? 'Deleting...' : 'Delete all data'}
          </button>
        </div>
        {message && <p className="mt-3 text-xs text-emerald-400">{message}</p>}
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
