import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useProjectStore } from '@/store/useProjectStore';
import { generatePlan } from '@/services/api';
import { usePolling } from '@/hooks/usePolling';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTheme } from '@/hooks/useTheme';
import { useNotification } from '@/hooks/useNotification';
import ProjectHeader from '@/components/dashboard/ProjectHeader';
import ProgressCard from '@/components/dashboard/ProgressCard';
import StatsCard from '@/components/dashboard/StatsCard';
import FileTreeView from '@/components/dashboard/FileTreeView';
import TechStackCard from '@/components/stack/TechStackCard';
import TimelineList from '@/components/timeline/TimelineList';
import TimelineDetailPanel from '@/components/timeline/TimelineDetailPanel';
import ErdViewer from '@/components/erd/ErdViewer';
import ErdTableDetail from '@/components/erd/ErdTableDetail';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorBanner from '@/components/common/ErrorBanner';
import type { CenterView, FileChangeEvent, PlanSummary } from '@/types';
import type { ErdTable, GitCommit } from '@/types';

export default function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [centerView, setCenterView] = useState<CenterView>('timeline');
  const [selectedErdTable, setSelectedErdTable] = useState<ErdTable | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDark, toggle } = useTheme();

  // 프로젝트 목록 로드 (드롭다운용)
  const { projects: allProjects, loadProjects: loadAllProjects } = useProjectStore();
  useEffect(() => { loadAllProjects(); }, [loadAllProjects]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Notification hook
  useNotification({
    projectName: summary?.project.name ?? null,
    timeline,
    plan,
  });

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

  const handlePlanUpdate = (updatedPlan: PlanSummary) => {
    useDashboardStore.setState({ plan: updatedPlan });
  };

  const handlePdfExport = () => {
    window.print();
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

  const printDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-screen flex flex-col">
      {/* 인쇄 전용 헤더 — 화면에서는 숨김 */}
      <div className="hidden print-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>{summary?.project.name ?? ''} — 프로젝트 보고서</span>
          <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#6b7280' }}>{printDate}</span>
        </div>
      </div>

      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex-shrink-0 relative z-[200] print:bg-white print:border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors print:hidden"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록
        </button>
        <span className="text-gray-700 print:hidden">|</span>
        <div className="relative print:hidden" ref={dropdownRef}>
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-gray-800"
          >
            {summary?.project.name ?? 'Loading...'}
            <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showProjectDropdown && allProjects.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-[#1e2235] border border-gray-600 rounded-lg shadow-2xl z-[100] py-1.5 max-h-80 overflow-y-auto scrollbar-thin">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">프로젝트 전환</div>
              {allProjects.map((p) => {
                const isCurrent = p.project.id === projectId;
                return (
                  <button
                    key={p.project.id}
                    onClick={() => {
                      setShowProjectDropdown(false);
                      navigate(`/project/${p.project.id}`);
                    }}
                    className={`w-full text-left px-3 py-2.5 transition-colors border-l-2 ${
                      isCurrent
                        ? 'bg-indigo-500/15 border-l-indigo-400 text-white'
                        : 'border-l-transparent text-gray-200 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : ''}`}>
                        {p.project.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.plan && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            p.plan.progressPercent >= 100 ? 'bg-green-500/20 text-green-300' :
                            p.plan.progressPercent >= 50 ? 'bg-indigo-500/20 text-indigo-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {p.plan.progressPercent}%
                          </span>
                        )}
                        {isCurrent && (
                          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono truncate block mt-0.5">{p.project.path}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block">
          <h1 className="text-lg font-bold text-gray-900">{summary?.project.name ?? ''}</h1>
        </div>

        {/* Center view tabs */}
        <div className="ml-auto flex items-center gap-1 bg-gray-800 rounded-lg p-0.5 print:hidden">
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

        {/* PDF export button */}
        <button
          onClick={handlePdfExport}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 print:hidden"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          PDF 저장
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors print:hidden"
          title={isDark ? '라이트 모드' : '다크 모드'}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
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
            projectId={projectId}
            onPlanUpdate={handlePlanUpdate}
          />

          <StatsCard projectId={projectId} />

          <TechStackCard
            stack={stack}
            loading={stackState === 'loading'}
            error={stackError}
            onRetry={() => loadStack(projectId)}
          />

          <FileTreeView projectId={projectId} />

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
              projectId={projectId}
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

      {/* 인쇄 전용 푸터 — 화면에서는 숨김 */}
      <div className="hidden print-footer" style={{ display: 'none' }}>
        Bart Dashboard — {summary?.project.name} | {summary?.project.path} | {printDate}
      </div>
    </div>
  );
}
