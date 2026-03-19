import { useState, useMemo } from 'react';
import type { GitCommit } from '@/types';
import { COMMIT_TYPE_LABELS } from '@shared/constants/index';
import { getCommitTypeBgClass } from '@/utils/colors';
import { formatDate } from '@/utils/format';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorBanner from '../common/ErrorBanner';

interface TimelineListProps {
  commits: GitCommit[];
  selectedHash: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (commit: GitCommit) => void;
  onRetry?: () => void;
}

export default function TimelineList({
  commits,
  selectedHash,
  loading,
  error,
  onSelect,
  onRetry,
}: TimelineListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return commits;
    const q = search.toLowerCase();
    return commits.filter(
      (c) =>
        c.subject.toLowerCase().includes(q) ||
        c.hashShort.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q)
    );
  }, [commits, search]);

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSkeleton variant="line" count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="relative">
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
            placeholder="커밋 검색..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {filtered.length}개의 커밋
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyState
            title="커밋 없음"
            description={search ? '검색 결과가 없습니다' : '아직 커밋이 없습니다'}
          />
        ) : (
          <div className="divide-y divide-gray-700/30">
            {filtered.map((commit) => {
              const isSelected = commit.hash === selectedHash;
              const dotClass = getCommitTypeBgClass(commit.type);

              return (
                <button
                  key={commit.hash}
                  onClick={() => onSelect(commit)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors ${
                    isSelected ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Type dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotClass}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${isSelected ? 'text-gray-100' : 'text-gray-300'} line-clamp-2`}>
                        {commit.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-500">
                          {formatDate(commit.date)}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">
                          {commit.hashShort}
                        </span>
                        <span className={`badge text-[10px] py-0 ${getCommitTypeBgClass(commit.type)} bg-opacity-20 text-gray-400`}>
                          {COMMIT_TYPE_LABELS[commit.type] ?? commit.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
