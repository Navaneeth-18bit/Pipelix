export default function LoadingState({ message = 'Loading pipeline metrics...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="mt-4 text-sm text-ink-400">{message}</p>
    </div>
  );
}
