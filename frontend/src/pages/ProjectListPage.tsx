import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { formatDate, formatPath, formatPercent } from '@/utils/format';
import AddProjectModal from '@/components/dashboard/AddProjectModal';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorBanner from '@/components/common/ErrorBanner';
import EmptyState from '@/components/common/EmptyState';
import Tooltip from '@/components/common/Tooltip';
import type { ProjectSummary } from '@/types';

function ProjectCard({ summary, onClick }: { summary: ProjectSummary; onClick: () => void }) {
  const { project, plan, gitStatus, lastCommit } = summary;
  const percent = plan?.progressPercent ?? 0;

  const progressColor =
    percent >= 100
      ? 'text-green-400'
      : percent >= 60
        ? 'text-indigo-400'
        : percent >= 30
          ? 'text-amber-400'
          : 'text-gray-500';

  const barColor =
    percent >= 100
      ? 'bg-green-500'
      : percent >= 60
        ? 'bg-indigo-500'
        : percent >= 30
          ? 'bg-amber-500'
          : 'bg-gray-600';

  const isActive = gitStatus?.isGitRepo && lastCommit;

  return (
    <button
      onClick={onClick}
      className="card-hover p-5 text-left w-full transition-all duration-200 group"
    >
      {/* Top row: name + status dot */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-100 group-hover:text-white truncate">
            {project.name}
          </h3>
          <Tooltip content={project.path} position="bottom">
            <span className="text-xs text-gray-500 font-mono cursor-default">
              {formatPath(project.path, 30)}
            </span>
          </Tooltip>
        </div>
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
            isActive ? 'bg-green-400' : 'bg-gray-600'
          }`}
          title={isActive ? '활성' : '비활성'}
        />
      </div>

      {/* Last commit */}
      {lastCommit ? (
        <div className="mb-3">
          <p className="text-sm text-gray-400 line-clamp-1">{lastCommit.subject}</p>
          <p className="text-xs text-gray-600 mt-0.5">{formatDate(lastCommit.date)}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-3">커밋 없음</p>
      )}

      {/* Progress */}
      {plan ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">진행률</span>
            <span className={`text-sm font-bold ${progressColor}`}>
              {formatPercent(percent)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <span>PLAN.md 없음</span>
        </div>
      )}

      {/* Git info */}
      {gitStatus?.isGitRepo && (
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <span className="px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">git</span>
          {gitStatus.currentBranch && (
            <span className="font-mono">{gitStatus.currentBranch}</span>
          )}
          <span>{gitStatus.totalCommits}개 커밋</span>
        </div>
      )}
    </button>
  );
}

export default function ProjectListPage() {
  const { projects, loading, error, loadProjects, reorderProjects } = useProjectStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // 드래그 상태 관리
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.project.name.toLowerCase().includes(q) ||
        p.project.path.toLowerCase().includes(q)
    );
  }, [projects, search]);

  // 검색 중이 아닐 때만 드래그 허용
  const isDraggable = !search.trim();

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const ids = filtered.map((s) => s.project.id);
      const [removed] = ids.splice(dragItem.current, 1);
      ids.splice(dragOverItem.current, 0, removed);
      reorderProjects(ids);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Bart Dashboard</h1>
            <p className="text-sm text-gray-500">Claude Code CLI 개발 진행 현황</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            프로젝트 추가
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="프로젝트 검색..."
              className="input-field pl-10 py-2.5"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={loadProjects} />
          </div>
        )}

        {/* Loading */}
        {loading && projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LoadingSkeleton variant="card" count={6} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? '검색 결과 없음' : '프로젝트 없음'}
            description={
              search
                ? '다른 검색어를 시도해보세요'
                : '새 프로젝트를 추가하여 시작하세요'
            }
            action={
              !search
                ? { label: '프로젝트 추가', onClick: () => setShowAddModal(true) }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((summary, idx) => (
              <div
                key={summary.project.id}
                draggable={isDraggable}
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`transition-all duration-150 ${
                  isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
                } ${dragIdx === idx ? 'opacity-40 scale-95' : ''} ${
                  dragIdx !== null && dragIdx !== idx ? 'hover:border-indigo-500 hover:border-2 rounded-xl' : ''
                }`}
              >
                <ProjectCard
                  summary={summary}
                  onClick={() => navigate(`/project/${summary.project.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
