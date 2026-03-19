import { useEffect, useState } from 'react';
import { fetchGitHubInfo } from '@/services/api';
import type { GitHubInfo } from '@/types';

export default function GitHubCard({ projectId }: { projectId: string }) {
  const [info, setInfo] = useState<GitHubInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGitHubInfo(projectId)
      .then((data) => { if (!cancelled) setInfo(data); })
      .catch(() => { if (!cancelled) setInfo(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="card p-4 space-y-2 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  if (!info) return null;

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}시간 전`;
    return `${Math.floor(hrs / 24)}일 전`;
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          GitHub
        </h3>
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {info.owner}/{info.repo}
        </a>
      </div>

      {/* Repo stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          {info.stars}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          {info.forks}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          PR {info.openPRs}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Issue {info.openIssues}
        </span>
      </div>

      {/* Open PRs */}
      {info.pullRequests.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Open PRs</h4>
          {info.pullRequests.map((pr) => (
            <a
              key={pr.number}
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-gray-300 hover:text-white transition-colors truncate"
            >
              <span className="text-green-400 mr-1">#{pr.number}</span>
              {pr.title}
              <span className="text-gray-600 ml-1">{formatDate(pr.updatedAt)}</span>
            </a>
          ))}
        </div>
      )}

      {/* Open Issues */}
      {info.issues.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Open Issues</h4>
          {info.issues.map((issue) => (
            <a
              key={issue.number}
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-gray-300 hover:text-white transition-colors truncate"
            >
              <span className="text-amber-400 mr-1">#{issue.number}</span>
              {issue.title}
              {issue.labels.length > 0 && (
                <span className="ml-1 text-[10px] text-gray-500">
                  [{issue.labels[0]}]
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
