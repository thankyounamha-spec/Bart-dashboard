interface StatusBadgeProps {
  label: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'indigo' | 'gray' | 'violet' | 'amber' | 'orange' | 'emerald';
  dotOnly?: boolean;
}

const colorMap: Record<string, { dot: string; bg: string; text: string }> = {
  green: { dot: 'bg-green-400', bg: 'bg-green-500/10', text: 'text-green-400' },
  yellow: { dot: 'bg-yellow-400', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  red: { dot: 'bg-red-400', bg: 'bg-red-500/10', text: 'text-red-400' },
  blue: { dot: 'bg-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  indigo: { dot: 'bg-indigo-400', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  gray: { dot: 'bg-gray-400', bg: 'bg-gray-500/10', text: 'text-gray-400' },
  violet: { dot: 'bg-violet-400', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  amber: { dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  orange: { dot: 'bg-orange-400', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  emerald: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

export default function StatusBadge({ label, color = 'gray', dotOnly = false }: StatusBadgeProps) {
  const c = colorMap[color] ?? colorMap.gray;

  if (dotOnly) {
    return (
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.dot}`} title={label} />
    );
  }

  return (
    <span className={`badge ${c.bg} ${c.text} border ${c.bg.replace('/10', '/20')}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mr-1.5`} />
      {label}
    </span>
  );
}
