import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-800 text-ink-400">
        {icon ?? <Inbox size={24} />}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink-100">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-400 max-w-sm">{message}</p>
    </div>
  );
}
