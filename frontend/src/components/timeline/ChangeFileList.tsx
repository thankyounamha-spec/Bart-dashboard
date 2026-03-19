import type { ChangedFile } from '@/types';
import { getFileStatusColor, getFileStatusBgColor } from '@/utils/colors';
import { formatPath } from '@/utils/format';
import Tooltip from '../common/Tooltip';

interface ChangeFileListProps {
  files: ChangedFile[];
  maxVisible?: number;
}

const statusIcons: Record<string, string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
  renamed: 'R',
};

export default function ChangeFileList({ files, maxVisible = 10 }: ChangeFileListProps) {
  const visible = files.slice(0, maxVisible);
  const remaining = files.length - maxVisible;

  if (files.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">변경된 파일이 없습니다</p>
    );
  }

  return (
    <div className="space-y-1">
      {visible.map((file, idx) => {
        const statusColor = getFileStatusColor(file.status);
        const bgColor = getFileStatusBgColor(file.status);

        return (
          <div
            key={`${file.path}-${idx}`}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm ${bgColor}`}
          >
            {/* Status letter */}
            <span className={`w-5 text-center text-xs font-bold ${statusColor}`}>
              {statusIcons[file.status] ?? '?'}
            </span>

            {/* File path */}
            <Tooltip content={file.path} position="top">
              <span className={`font-mono text-xs ${statusColor} truncate max-w-[240px]`}>
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
            </div>
          </div>
        );
      })}

      {remaining > 0 && (
        <p className="text-xs text-gray-500 px-2.5 py-1">
          +{remaining}개 파일 더 있음
        </p>
      )}
    </div>
  );
}
