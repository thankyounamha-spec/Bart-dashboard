import { useState } from 'react';
import type { ChangedFile, FileDiff } from '@/types';
import { getFileStatusColor, getFileStatusBgColor } from '@/utils/colors';
import { formatPath } from '@/utils/format';
import { fetchFileDiff } from '@/services/api';
import Tooltip from '../common/Tooltip';

interface ChangeFileListProps {
  files: ChangedFile[];
  maxVisible?: number;
  projectId?: string;
  commitHash?: string;
}

const statusIcons: Record<string, string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
  renamed: 'R',
};

function DiffLine({ line }: { line: string }) {
  let className = 'text-gray-300';
  if (line.startsWith('+')) {
    className = 'bg-emerald-900/30 text-emerald-300';
  } else if (line.startsWith('-')) {
    className = 'bg-red-900/30 text-red-300';
  } else if (line.startsWith('@@')) {
    className = 'bg-blue-900/20 text-blue-400';
  }
  return <div className={`px-2 ${className}`}>{line || '\u00A0'}</div>;
}

function FileRow({
  file,
  idx,
  projectId,
  commitHash,
}: {
  file: ChangedFile;
  idx: number;
  projectId?: string;
  commitHash?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const statusColor = getFileStatusColor(file.status);
  const bgColor = getFileStatusBgColor(file.status);
  const canExpand = !!projectId && !!commitHash;

  const handleToggleDiff = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (!projectId || !commitHash) return;

    setExpanded(true);
    if (diff) return; // already loaded

    setDiffLoading(true);
    setDiffError(null);
    try {
      const result = await fetchFileDiff(projectId, commitHash, file.path);
      setDiff(result);
    } catch (err) {
      setDiffError(err instanceof Error ? err.message : 'diff를 불러올 수 없습니다');
    } finally {
      setDiffLoading(false);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm ${bgColor}`}
      >
        {/* Status letter */}
        <span className={`w-5 text-center text-xs font-bold ${statusColor}`}>
          {statusIcons[file.status] ?? '?'}
        </span>

        {/* File path */}
        <Tooltip content={file.path} position="top">
          <span className={`font-mono text-xs ${statusColor} truncate max-w-[180px]`}>
            {formatPath(file.path, 40)}
          </span>
        </Tooltip>

        {/* Additions/deletions */}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          {file.additions !== undefined && file.additions > 0 && (
            <span className="text-xs text-emerald-400">+{file.additions}</span>
          )}
          {file.deletions !== undefined && file.deletions > 0 && (
            <span className="text-xs text-red-400">-{file.deletions}</span>
          )}

          {/* Expand/collapse button */}
          {canExpand && (
            <button
              onClick={handleToggleDiff}
              className="ml-1 text-gray-500 hover:text-gray-300 transition-colors p-0.5"
              title={expanded ? '접기' : 'diff 보기'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Diff content */}
      {expanded && (
        <div className="mt-1 mb-2 ml-7 rounded-md overflow-hidden border border-gray-700/50">
          {diffLoading && (
            <p className="text-xs text-gray-500 p-3">로딩 중...</p>
          )}
          {diffError && (
            <p className="text-xs text-red-400 p-3">{diffError}</p>
          )}
          {diff && (
            <>
              <pre className="text-[11px] font-mono overflow-x-auto max-h-64 scrollbar-thin">
                <code>
                  {diff.diff.split('\n').map((line, lineIdx) => (
                    <DiffLine key={lineIdx} line={line} />
                  ))}
                </code>
              </pre>
              {diff.truncated && (
                <p className="text-xs text-amber-400 px-3 py-1.5 bg-amber-900/10 border-t border-gray-700/50">
                  (diff가 너무 깁니다. 일부만 표시합니다.)
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChangeFileList({ files, maxVisible = 10, projectId, commitHash }: ChangeFileListProps) {
  const visible = files.slice(0, maxVisible);
  const remaining = files.length - maxVisible;

  if (files.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">변경된 파일이 없습니다</p>
    );
  }

  return (
    <div className="space-y-1">
      {visible.map((file, idx) => (
        <FileRow
          key={`${file.path}-${idx}`}
          file={file}
          idx={idx}
          projectId={projectId}
          commitHash={commitHash}
        />
      ))}

      {remaining > 0 && (
        <p className="text-xs text-gray-500 px-2.5 py-1">
          +{remaining}개 파일 더 있음
        </p>
      )}
    </div>
  );
}
