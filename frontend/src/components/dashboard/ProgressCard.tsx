import { useState } from 'react';
import type { PlanSummary } from '@/types';
import { formatPercent } from '@/utils/format';
import { togglePlanTask } from '@/services/api';
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
  projectId?: string;
  onPlanUpdate?: (plan: PlanSummary) => void;
}

export default function ProgressCard({ plan, loading, error, onRetry, onGenerate, generating, projectId, onPlanUpdate }: ProgressCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  const handleToggleTask = async (sectionIndex: number, taskIndex: number) => {
    if (!projectId || !plan) return;

    const taskKey = `${sectionIndex}-${taskIndex}`;
    setTogglingTask(taskKey);

    // Optimistic update
    const oldPlan = plan;
    const updatedPlan = structuredClone(plan);
    const task = updatedPlan.sections[sectionIndex]?.tasks[taskIndex];
    if (task) {
      task.completed = !task.completed;
      // Recalculate section stats
      const section = updatedPlan.sections[sectionIndex];
      section.completedTasks = section.tasks.filter((t) => t.completed).length;
      section.progressPercent = section.totalTasks > 0
        ? Math.round((section.completedTasks / section.totalTasks) * 100)
        : 0;
      // Recalculate overall stats
      updatedPlan.completedTasks = updatedPlan.sections.reduce((sum, s) => sum + s.completedTasks, 0);
      updatedPlan.totalTasks = updatedPlan.sections.reduce((sum, s) => sum + s.totalTasks, 0);
      updatedPlan.progressPercent = updatedPlan.totalTasks > 0
        ? Math.round((updatedPlan.completedTasks / updatedPlan.totalTasks) * 100)
        : 0;
      onPlanUpdate?.(updatedPlan);
    }

    try {
      const serverPlan = await togglePlanTask(projectId, sectionIndex, taskIndex);
      onPlanUpdate?.(serverPlan);
    } catch {
      // Revert on error
      onPlanUpdate?.(oldPlan);
    } finally {
      setTogglingTask(null);
    }
  };

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
              {plan.sections.map((section, sectionIdx) => (
                <div key={sectionIdx} className="space-y-1">
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
                  {/* Task checkboxes */}
                  {section.tasks && section.tasks.length > 0 && (
                    <div className="mt-1 space-y-0.5 pl-2">
                      {section.tasks.map((task, taskIdx) => {
                        const taskKey = `${sectionIdx}-${taskIdx}`;
                        const isToggling = togglingTask === taskKey;
                        return (
                          <label
                            key={taskIdx}
                            className="flex items-start gap-1.5 text-xs cursor-pointer group"
                          >
                            <span className="relative flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTask(sectionIdx, taskIdx)}
                                disabled={isToggling || !projectId}
                                className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer disabled:opacity-50"
                              />
                              {isToggling && (
                                <span className="absolute -right-4 top-0 text-[10px] text-gray-500 animate-pulse">...</span>
                              )}
                            </span>
                            <span className={`${task.completed ? 'text-gray-600 line-through' : 'text-gray-400 group-hover:text-gray-300'} transition-colors`}>
                              {task.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
