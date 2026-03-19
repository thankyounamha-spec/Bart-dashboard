import { useState } from 'react';
import type { ErdResult, ErdTable } from '@/types';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorBanner from '../common/ErrorBanner';

interface ErdViewerProps {
  erd: ErdResult | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  onSelectTable?: (table: ErdTable) => void;
}

const MAX_COLUMNS_VISIBLE = 8;

function ErdTableCard({
  table,
  onSelect,
}: {
  table: ErdTable;
  onSelect?: (table: ErdTable) => void;
}) {
  const visibleColumns = table.columns.slice(0, MAX_COLUMNS_VISIBLE);
  const remaining = table.columns.length - MAX_COLUMNS_VISIBLE;

  return (
    <div className="card hover:border-indigo-500/50 transition-colors">
      {/* Table name header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-700/30 border-b border-gray-700/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span className="text-sm font-semibold text-gray-200">{table.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelect?.(table)}
            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded transition-colors hover:bg-indigo-500/10"
          >
            보기
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="divide-y divide-gray-700/30">
        {visibleColumns.map((col) => (
          <div
            key={col.name}
            className="flex items-center gap-2 px-4 py-2 text-sm"
          >
            {/* Icon */}
            <span className="w-4 flex-shrink-0">
              {col.isPrimaryKey ? (
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
              ) : col.isForeignKey ? (
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                </svg>
              ) : (
                <span className="inline-block w-1.5 h-1.5 bg-gray-600 rounded-full ml-1" />
              )}
            </span>

            {/* Name */}
            <span className="text-gray-300 font-mono text-xs flex-1 truncate">
              {col.name}
            </span>

            {/* Type */}
            <span className="text-gray-500 text-xs font-mono flex-shrink-0">
              {col.type}
            </span>

            {/* Nullable indicator */}
            {!col.isNullable && !col.isPrimaryKey && (
              <span className="text-[10px] text-amber-500/60 flex-shrink-0">NOT NULL</span>
            )}
          </div>
        ))}
      </div>

      {/* More indicator */}
      {remaining > 0 && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-700/30">
          +{remaining} more
        </div>
      )}
    </div>
  );
}

export default function ErdViewer({
  erd,
  loading,
  error,
  onRetry,
  onSelectTable,
}: ErdViewerProps) {
  const [_githubUrl, setGithubUrl] = useState('');

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!erd || erd.source === 'none' || erd.tables.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="스키마 파일을 찾을 수 없습니다"
            description="Prisma, TypeORM 또는 SQL 스키마 파일이 프로젝트에 필요합니다"
          />
        </div>

        {/* Github sync input */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={_githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="Github 동기화 URL"
              className="input-field text-sm flex-1"
            />
            <button className="btn-secondary text-sm flex-shrink-0">
              동기화
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-300">ERD Diagram</h3>
          <span className="text-xs text-gray-500">
            {erd.tables.length}개 테이블 | {erd.relations.length}개 관계
          </span>
        </div>
        {erd.sourceFile && (
          <span className="text-xs text-gray-500 font-mono">
            {erd.sourceFile}
          </span>
        )}
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {erd.tables.map((table) => (
            <ErdTableCard
              key={table.name}
              table={table}
              onSelect={onSelectTable}
            />
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={_githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="Github 동기화 URL"
            className="input-field text-sm flex-1"
          />
          <button className="btn-secondary text-sm">수정</button>
          <button className="btn-primary text-sm">보기</button>
        </div>
      </div>
    </div>
  );
}
