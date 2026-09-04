import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { qualityScore, validRecords, invalidRecords, qualityBreakdown } from '@/data/sampleData';

export default function QualityScore() {
  const data = [
    { name: 'Valid', value: validRecords, color: '#22c55e' },
    { name: 'Invalid', value: invalidRecords, color: '#ef4444' },
  ];

  return (
    <div className="flex flex-col items-center lg:flex-row lg:items-center gap-6">
      {/* Donut */}
      <div className="relative shrink-0">
        <div className="h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-ink-50">{qualityScore}%</span>
          <span className="text-[11px] text-ink-400 mt-0.5">Quality Score</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 w-full space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success-500" />
              <span className="text-xs text-ink-400">Valid Records</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-ink-50">{validRecords.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-800 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-danger-500" />
              <span className="text-xs text-ink-400">Invalid Records</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-ink-50">{invalidRecords.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          {qualityBreakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-ink-300">{item.label}</span>
              <span className={`font-semibold ${item.value > 0 ? 'text-warning-400' : 'text-success-400'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
