import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeamOverview } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';
import type { TeamOverview } from '@/types';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

export default function TeamMonitorPage() {
  const [data, setData] = useState<TeamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    fetchTeamOverview()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">팀 모니터링</h1>
            <p className="text-sm text-gray-500">전체 프로젝트 활동 현황</p>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => navigate('/')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              프로젝트 목록
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : !data ? (
          <p className="text-gray-500 text-center py-12">데이터를 불러올 수 없습니다.</p>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard label="전체 프로젝트" value={data.totalProjects} icon="folder" />
              <SummaryCard label="활성 프로젝트 (7일)" value={data.activeProjects} icon="activity" color="green" />
              <SummaryCard label="오늘 커밋" value={data.totalCommitsToday} icon="today" color="indigo" />
              <SummaryCard label="이번 주 커밋" value={data.totalCommitsWeek} icon="week" color="purple" />
            </div>

            {/* Author stats */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">개발자별 활동</h2>
              {data.authorStats.length === 0 ? (
                <p className="text-xs text-gray-500">이번 주 커밋 기록이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-800">
                        <th className="text-left py-2 pr-4">개발자</th>
                        <th className="text-right py-2 px-3">오늘</th>
                        <th className="text-right py-2 px-3">이번 주</th>
                        <th className="text-left py-2 px-3">마지막 커밋</th>
                        <th className="text-left py-2 pl-3">참여 프로젝트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.authorStats.map((a) => (
                        <tr key={a.author} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-2 pr-4 text-gray-200 font-medium">{a.author}</td>
                          <td className="py-2 px-3 text-right">
                            {a.commitsToday > 0 && (
                              <span className="text-green-400 font-bold">{a.commitsToday}</span>
                            )}
                            {a.commitsToday === 0 && <span className="text-gray-600">0</span>}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-300">{a.commitsWeek}</td>
                          <td className="py-2 px-3 text-gray-500">
                            {a.lastCommitDate ? new Date(a.lastCommitDate).toLocaleDateString('ko-KR', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            }) : '-'}
                          </td>
                          <td className="py-2 pl-3">
                            <div className="flex flex-wrap gap-1">
                              {a.projects.map((p) => (
                                <span key={p} className="px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 text-[10px]">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inactive projects warning */}
            {data.inactiveProjects.length > 0 && (
              <div className="card p-5 border-amber-500/20">
                <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  비활성 프로젝트 ({data.inactiveProjects.length})
                </h2>
                <div className="space-y-2">
                  {data.inactiveProjects.map((p) => (
                    <div key={p.projectId} className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => navigate(`/project/${p.projectId}`)}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {p.projectName}
                      </button>
                      <span className="text-gray-500">
                        {p.daysSinceLastCommit >= 0
                          ? `${p.daysSinceLastCommit}일 전`
                          : '커밋 없음'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color = 'gray',
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    gray: 'text-gray-300',
    green: 'text-green-400',
    indigo: 'text-indigo-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] ?? colorMap.gray}`}>{value}</p>
    </div>
  );
}
