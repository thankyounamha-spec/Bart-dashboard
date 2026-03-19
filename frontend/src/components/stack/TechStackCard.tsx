import type { TechStackResult, TechStack } from '@/types';
import { getTechCategoryClasses } from '@/utils/colors';
import Tooltip from '../common/Tooltip';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorBanner from '../common/ErrorBanner';

interface TechStackCardProps {
  stack: TechStackResult | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

function TechBadge({ tech }: { tech: TechStack }) {
  const classes = getTechCategoryClasses(tech.category);
  const tooltipContent = [
    tech.version && `v${tech.version}`,
    `source: ${tech.source}`,
    tech.sourceFile && `file: ${tech.sourceFile}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <Tooltip content={tooltipContent} position="top">
      <span
        className={`badge border cursor-default ${classes}`}
      >
        {tech.name}
      </span>
    </Tooltip>
  );
}

export default function TechStackCard({ stack, loading, error, onRetry }: TechStackCardProps) {
  if (loading) return <LoadingSkeleton variant="block" />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;
  if (!stack || stack.stacks.length === 0) {
    return (
      <div className="card p-5">
        <EmptyState title="기술 스택 없음" description="감지된 기술 스택이 없습니다" />
      </div>
    );
  }

  // Group by category
  const grouped = stack.stacks.reduce<Record<string, TechStack[]>>((acc, tech) => {
    const cat = tech.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tech);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    language: '언어',
    framework: '프레임워크',
    library: '라이브러리',
    database: '데이터베이스',
    tool: '도구',
    runtime: '런타임',
    other: '기타',
  };

  return (
    <div className="card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <h3 className="text-sm font-medium text-gray-300">Tech Stacks</h3>
        <span className="text-xs text-gray-500">({stack.stacks.length})</span>
      </div>

      {/* Badges grouped by category */}
      {Object.entries(grouped).map(([category, techs]) => (
        <div key={category} className="space-y-1.5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {categoryLabels[category] ?? category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {techs.map((tech) => (
              <TechBadge key={tech.name} tech={tech} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
