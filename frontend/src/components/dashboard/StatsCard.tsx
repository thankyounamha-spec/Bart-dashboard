import { useEffect, useState } from 'react';
import type { CommitStats } from '@/types';
import { fetchStats } from '@/services/api';
import { getCommitTypeBgClass } from '@/utils/colors';
import LoadingSkeleton from '../common/LoadingSkeleton';
import ErrorBanner from '../common/ErrorBanner';

interface StatsCardProps {
  projectId: string;
}

export default function StatsCard({ projectId }: StatsCardProps) {
  const [stats, setStats] = useState<CommitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchStats(projectId)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '통계를 불러올 수 없습니다');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) return <LoadingSkeleton variant="block" />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!stats) return null;

  const maxDayCount = Math.max(...stats.commitsByDay.map((d) => d.count), 1);

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-medium text-gray-400 dark:text-gray-400">커밋 통계</h3>

      {/* Today / Week */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-700/30 dark:bg-gray-700/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-indigo-400">{stats.todayCommits}</p>
          <p className="text-xs text-gray-500">오늘</p>
        </div>
        <div className="bg-gray-700/30 dark:bg-gray-700/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.weekCommits}</p>
          <p className="text-xs text-gray-500">이번 주</p>
        </div>
      </div>

      {/* Most active hour */}
      {stats.mostActiveHour !== null && (
        <p className="text-xs text-gray-500">
          가장 활발한 시간: <span className="text-gray-300 font-medium">{stats.mostActiveHour}시</span>
        </p>
      )}

      {/* Mini bar chart - last 7 days */}
      {stats.commitsByDay.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">최근 7일</p>
          <div className="flex items-end gap-1 h-12">
            {stats.commitsByDay.slice(-7).map((day, idx) => {
              const height = day.count > 0 ? Math.max((day.count / maxDayCount) * 100, 8) : 4;
              const dateLabel = day.date.slice(5); // MM-DD
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full bg-indigo-500 rounded-sm transition-all duration-300"
                    style={{ height: `${height}%` }}
                    title={`${dateLabel}: ${day.count}개`}
                  />
                  <span className="text-[9px] text-gray-600">{dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Commit type distribution */}
      {Object.keys(stats.commitsByType).length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">커밋 유형</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.commitsByType).map(([type, count]) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${getCommitTypeBgClass(type)} bg-opacity-80`}
              >
                {type}
                <span className="opacity-80">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
