import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardStore } from '@/store/useDashboardStore';
import { generatePlan } from '@/services/api';
import { usePolling } from '@/hooks/usePolling';
import { useWebSocket } from '@/hooks/useWebSocket';
import ProjectHeader from '@/components/dashboard/ProjectHeader';
import ProgressCard from '@/components/dashboard/ProgressCard';
import TechStackCard from '@/components/stack/TechStackCard';
import TimelineList from '@/components/timeline/TimelineList';
import TimelineDetailPanel from '@/components/timeline/TimelineDetailPanel';
import ErdViewer from '@/components/erd/ErdViewer';
import ErdTableDetail from '@/components/erd/ErdTableDetail';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorBanner from '@/components/common/ErrorBanner';
import type { CenterView, FileChangeEvent } from '@/types';
import type { ErdTable, GitCommit } from '@/types';

export default function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [centerView, setCenterView] = useState<CenterView>('timeline');
  const [selectedErdTable, setSelectedErdTable] = useState<ErdTable | null>(null);

  const {
    summary,
    plan,
    stack,
    timeline,
    erd,
    selectedCommit,
    summaryState,
    planState,
    stackState,
    timelineState,
    erdState,
    commitDetailState,
    syncState,
    summaryError,
    planError,
    stackError,
    timelineError,
    erdError,
    commitDetailError,
    loadAll,
    loadPlan,
    loadStack,
    loadTimeline,
    loadErd,
    selectCommit,
    clearSelectedCommit,
    sync,
    reset,
  } = useDashboardStore();

  // Load all data on mount
  useEffect(() => {
    if (!projectId) return;
    reset();
    loadAll(projectId);
    return () => reset();
  }, [projectId, loadAll, reset]);

  // Polling every 30 seconds
  usePolling(
    useCallback(() => {
      if (projectId) loadAll(projectId);
    }, [projectId, loadAll]),
    30000,
    !!projectId
  );

  // WebSocket for real-time updates
  useWebSocket({
    projectId: projectId ?? null,
    onFileChange: useCallback(
      (event: FileChangeEvent) => {
        if (!projectId) return;
        switch (event.changeType) {
          case 'plan':
            loadPlan(projectId);
            break;
          case 'git':
            loadTimeline(projectId);
            break;
          case 'config':
            loadStack(projectId);
            break;
          case 'schema':
            loadErd(projectId);
            break;
        }
      },
      [projectId, loadPlan, loadTimeline, loadStack, loadErd]
    ),
  });

  const handleCommitSelect = (commit: GitCommit) => {
    if (projectId) {
      selectCommit(projectId, commit.hash);
    }
  };

  const handleSync = () => {
    if (projectId) sync(projectId);
  };

  const [generating, setGenerating] = useState(false);
  const handleGeneratePlan = async () => {
    if (!projectId) return;
    setGenerating(true);
    try {
      await generatePlan(projectId);
      await loadPlan(projectId);
    } catch {
      // error handled by store
    } finally {
      setGenerating(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorBanner message="프로젝트 ID가 없습니다" />
      </div>
    );
  }

  if (summaryState === 'loading' && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (summaryState === 'error' && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full space-y-4">
          <ErrorBanner
            message={summaryError ?? '프로젝트를 불러올 수 없습니다'}
            onRetry={() => loadAll(projectId)}
          />
          <button onClick={() => navigate('/')} className="btn-secondary text-sm w-full">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록
        </button>
        <span className="text-gray-700">|</span>
        <span className="text-sm font-semibold text-gray-200">
          {summary?.project.name ?? 'Loading...'}
        </span>

        {/* Center view tabs */}
        <div className="ml-auto flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => {
              setCenterView('timeline');
              setSelectedErdTable(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              centerView === 'timeline'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            타임라인
          </button>
          <button
            onClick={() => {
              setCenterView('erd');
              clearSelectedCommit();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              centerView === 'erd'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ERD Diagram
          </button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[280px] flex-shrink-0 border-r border-gray-800 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {summary && (
            <ProjectHeader
              summary={summary}
              syncing={syncState === 'loading'}
              onSync={handleSync}
            />
          )}

          <ProgressCard
            plan={plan}
            loading={planState === 'loading'}
            error={planError}
            onRetry={() => loadPlan(projectId)}
            onGenerate={handleGeneratePlan}
            generating={generating}
          />

          <TechStackCard
            stack={stack}
            loading={stackState === 'loading'}
            error={stackError}
            onRetry={() => loadStack(projectId)}
          />

          {/* Mini ERD summary in sidebar */}
          {erd && erd.tables.length > 0 && (
            <div className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400">ERD</h3>
                <button
                  onClick={() => setCenterView('erd')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  자세히 보기
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {erd.tables.length}개 테이블 | {erd.relations.length}개 관계
              </p>
              <div className="flex flex-wrap gap-1">
                {erd.tables.slice(0, 6).map((t) => (
                  <span key={t.name} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 font-mono">
                    {t.name}
                  </span>
                ))}
                {erd.tables.length > 6 && (
                  <span className="text-[10px] text-gray-600">
                    +{erd.tables.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Center panel */}
        <main className="flex-1 overflow-hidden border-r border-gray-800 flex flex-col">
          {centerView === 'timeline' ? (
            <TimelineList
              commits={timeline}
              selectedHash={selectedCommit?.hash ?? null}
              loading={timelineState === 'loading'}
              error={timelineError}
              onSelect={handleCommitSelect}
              onRetry={() => loadTimeline(projectId)}
            />
          ) : (
            <ErdViewer
              erd={erd}
              loading={erdState === 'loading'}
              error={erdError}
              onRetry={() => loadErd(projectId)}
              onSelectTable={(table) => setSelectedErdTable(table)}
            />
          )}
        </main>

        {/* Right detail panel */}
        <aside className="w-[360px] flex-shrink-0 overflow-hidden flex flex-col">
          {centerView === 'timeline' ? (
            <TimelineDetailPanel
              commit={selectedCommit}
              loading={commitDetailState === 'loading'}
              error={commitDetailError}
            />
          ) : selectedErdTable ? (
            <ErdTableDetail
              table={selectedErdTable}
              onClose={() => setSelectedErdTable(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">테이블을 선택하세요</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
