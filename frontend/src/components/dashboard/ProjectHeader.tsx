import Tooltip from '../common/Tooltip';
import StatusBadge from '../common/StatusBadge';
import { formatPath, formatDate } from '@/utils/format';
import type { ProjectSummary } from '@/types';

interface ProjectHeaderProps {
  summary: ProjectSummary;
  syncing?: boolean;
  onSync: () => void;
}

export default function ProjectHeader({ summary, syncing = false, onSync }: ProjectHeaderProps) {
  const { project, gitStatus } = summary;

  return (
    <div className="card p-5 space-y-3">
      {/* Project name */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-100 truncate">
            {project.name}
          </h1>
          <Tooltip content={project.path} position="bottom">
            <span className="text-sm text-gray-500 font-mono cursor-default">
              {formatPath(project.path, 35)}
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Git status + sync */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {gitStatus?.isGitRepo ? (
            <>
              <StatusBadge label="Git" color="green" />
              {gitStatus.currentBranch && (
                <span className="text-xs text-gray-400 font-mono">
                  {gitStatus.currentBranch}
                </span>
              )}
            </>
          ) : (
            <StatusBadge label="Git 없음" color="gray" />
          )}
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {syncing ? '동기화 중...' : '동기화'}
        </button>
      </div>

      {/* Last sync */}
      {project.lastSyncedAt && (
        <p className="text-xs text-gray-500">
          마지막 동기화: {formatDate(project.lastSyncedAt)}
        </p>
      )}
    </div>
  );
}
