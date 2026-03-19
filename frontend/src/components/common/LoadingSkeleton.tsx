interface LoadingSkeletonProps {
  variant?: 'card' | 'line' | 'circle' | 'block';
  count?: number;
  className?: string;
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`h-4 bg-gray-700 rounded animate-skeleton ${className}`} />
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-700 animate-skeleton" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-2/3 h-3" />
        </div>
      </div>
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-4/5" />
      <div className="flex gap-2">
        <SkeletonLine className="w-16 h-6 rounded-full" />
        <SkeletonLine className="w-16 h-6 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-3">
      <SkeletonLine className="w-1/4 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-5/6" />
    </div>
  );
}

export default function LoadingSkeleton({
  variant = 'card',
  count = 1,
  className = '',
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((i) => {
        switch (variant) {
          case 'card':
            return <SkeletonCard key={i} />;
          case 'line':
            return <SkeletonLine key={i} />;
          case 'circle':
            return (
              <div key={i} className="w-10 h-10 rounded-full bg-gray-700 animate-skeleton" />
            );
          case 'block':
            return <SkeletonBlock key={i} />;
          default:
            return <SkeletonCard key={i} />;
        }
      })}
    </div>
  );
}
