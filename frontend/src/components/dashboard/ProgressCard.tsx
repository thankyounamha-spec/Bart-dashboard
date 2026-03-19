import { useState } from 'react';
import type { PlanSummary } from '@/types';
import { formatPercent } from '@/utils/format';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorBanner from '../common/ErrorBanner';

interface ProgressCardProps {
  plan: PlanSummary | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onGenerate?: () => void;
  generating?: boolean;
}

export default function ProgressCard({ plan, loading, error, onRetry, onGenerate, generating }: ProgressCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) return <LoadingSkeleton variant="block" />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;
  if (!plan) {
    return (
      <div className="card p-5 space-y-3">
        <EmptyState title="플랜 없음" description="PLAN.md 파일을 찾을 수 없습니다" />
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="btn-primary w-full text-sm"
          >
            {generating ? '생성 중...' : 'PLAN.md 자동 생성'}
          </button>
        )}
      </div>
    );
  }

  const completed = plan.completedTasks;
  const total = plan.totalTasks;
  const remaining = total - completed;
  const percent = plan.progressPercent;

  // Color based on progress
  const progressColor =
    percent >= 100
      ? 'text-green-400'
      : percent >= 60
        ? 'text-indigo-400'
        : percent >= 30
          ? 'text-amber-400'
          : 'text-gray-400';

  const barColor =
    percent >= 100
      ? 'bg-green-500'
      : percent >= 60
        ? 'bg-indigo-500'
        : percent >= 30
          ? 'bg-amber-500'
          : 'bg-gray-500';

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">전체 진행률</h3>
      </div>

      {/* Big percentage */}
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold ${progressColor}`}>
          {formatPercent(percent)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <p className="text-xs text-gray-500">
        {completed}단계 완료 / {remaining}단계 남음
      </p>

      {/* Section progress (collapsible) */}
      {plan.sections.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            섹션별 진행률 ({plan.sections.length})
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {plan.sections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 truncate flex-1 mr-2">
                      {section.title}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {section.completedTasks}/{section.totalTasks}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        section.progressPercent >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(section.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
