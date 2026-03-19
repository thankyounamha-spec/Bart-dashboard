import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { formatDate, formatPercent } from '@/utils/format';
import { useTheme } from '@/hooks/useTheme';
import type { ProjectSummary } from '@/types';

function ProjectSelector({
  label,
  projects,
  selectedId,
  onChange,
}: {
  label: string;
  projects: ProjectSummary[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="input-field text-sm py-2"
      >
        <option value="">프로젝트 선택</option>
        {projects.map((p) => (
          <option key={p.project.id} value={p.project.id}>
            {p.project.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function CompareColumn({ summary }: { summary: ProjectSummary | null }) {
  if (!summary) {
    return (
      <div className="card p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-gray-500">프로젝트를 선택하세요</p>
      </div>
    );
  }

  const { project, plan, gitStatus, lastCommit } = summary;
  const percent = plan?.progressPercent ?? 0;

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-base font-semibold text-gray-100 dark:text-gray-100">{project.name}</h3>
      <p className="text-xs text-gray-500 font-mono truncate">{project.path}</p>

      <div className="space-y-3">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">진행률</span>
          <span className="text-sm font-bold text-indigo-400">
            {plan ? formatPercent(percent) : 'N/A'}
          </span>
        </div>
        {plan && (
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        )}

        {/* Git info */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">총 커밋 수</span>
          <span className="text-sm text-gray-300">
            {gitStatus?.totalCommits ?? 0}개
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">브랜치</span>
          <span className="text-sm text-gray-300 font-mono">
            {gitStatus?.currentBranch ?? 'N/A'}
          </span>
        </div>

        {/* Last commit */}
        <div>
          <span className="text-xs text-gray-500">마지막 커밋</span>
          {lastCommit ? (
            <div className="mt-1">
              <p className="text-xs text-gray-300 line-clamp-2">{lastCommit.subject}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(lastCommit.date)}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-600 mt-1">없음</p>
          )}
        </div>

        {/* Tasks */}
        {plan && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">완료/전체 태스크</span>
            <span className="text-sm text-gray-300">
              {plan.completedTasks}/{plan.totalTasks}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectComparePage() {
  const navigate = useNavigate();
  const { projects, loadProjects } = useProjectStore();
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const leftProject = projects.find((p) => p.project.id === leftId) ?? null;
  const rightProject = projects.find((p) => p.project.id === rightId) ?? null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 dark:border-gray-800 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <h1 className="text-lg font-bold text-gray-100">프로젝트 비교</h1>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Selectors */}
        <div className="grid grid-cols-2 gap-6">
          <ProjectSelector
            label="프로젝트 A"
            projects={projects}
            selectedId={leftId}
            onChange={setLeftId}
          />
          <ProjectSelector
            label="프로젝트 B"
            projects={projects}
            selectedId={rightId}
            onChange={setRightId}
          />
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-6">
          <CompareColumn summary={leftProject} />
          <CompareColumn summary={rightProject} />
        </div>

        {/* Comparison table */}
        {leftProject && rightProject && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">항목</th>
                  <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">{leftProject.project.name}</th>
                  <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">{rightProject.project.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">진행률</td>
                  <td className="px-4 py-2.5 text-center text-gray-200">{leftProject.plan ? formatPercent(leftProject.plan.progressPercent) : 'N/A'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-200">{rightProject.plan ? formatPercent(rightProject.plan.progressPercent) : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">커밋 수</td>
                  <td className="px-4 py-2.5 text-center text-gray-200">{leftProject.gitStatus?.totalCommits ?? 0}</td>
                  <td className="px-4 py-2.5 text-center text-gray-200">{rightProject.gitStatus?.totalCommits ?? 0}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">브랜치</td>
                  <td className="px-4 py-2.5 text-center text-gray-200 font-mono">{leftProject.gitStatus?.currentBranch ?? 'N/A'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-200 font-mono">{rightProject.gitStatus?.currentBranch ?? 'N/A'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">완료 태스크</td>
                  <td className="px-4 py-2.5 text-center text-gray-200">{leftProject.plan ? `${leftProject.plan.completedTasks}/${leftProject.plan.totalTasks}` : 'N/A'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-200">{rightProject.plan ? `${rightProject.plan.completedTasks}/${rightProject.plan.totalTasks}` : 'N/A'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">마지막 커밋</td>
                  <td className="px-4 py-2.5 text-center text-gray-200 text-xs">{leftProject.lastCommit ? formatDate(leftProject.lastCommit.date) : 'N/A'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-200 text-xs">{rightProject.lastCommit ? formatDate(rightProject.lastCommit.date) : 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
