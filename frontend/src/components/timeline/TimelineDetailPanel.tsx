import type { GitCommitDetail } from '@/types';
import { COMMIT_TYPE_LABELS } from '@shared/constants/index';
import { getCommitTypeBgClass } from '@/utils/colors';
import { formatFullDate } from '@/utils/format';
import ChangeFileList from './ChangeFileList';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorBanner from '../common/ErrorBanner';

interface TimelineDetailPanelProps {
  commit: GitCommitDetail | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  projectId?: string;
}

export default function TimelineDetailPanel({
  commit,
  loading,
  error,
  onRetry,
  projectId,
}: TimelineDetailPanelProps) {
  if (loading) {
    return (
      <div className="p-5">
        <LoadingSkeleton variant="block" count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <ErrorBanner message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!commit) {
    return (
      <EmptyState
        title="커밋을 선택하세요"
        description="왼쪽 타임라인에서 커밋을 클릭하면 상세 정보가 표시됩니다"
      />
    );
  }

  const typeLabel = COMMIT_TYPE_LABELS[commit.type] ?? commit.type;
  const dotClass = getCommitTypeBgClass(commit.type);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-700/50">
        <h3 className="text-sm font-medium text-gray-400 mb-3">상세 정보</h3>

        {/* Type badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`badge ${dotClass} bg-opacity-20 text-white`}>
            {typeLabel}
          </span>
          <span className="text-xs text-gray-500 font-mono">{commit.hashShort}</span>
        </div>

        {/* Subject */}
        <h2 className="text-base font-semibold text-gray-100 leading-snug">
          {commit.subject}
        </h2>
      </div>

      {/* Body / Analysis */}
      {commit.body && (
        <div className="px-5 py-4 border-b border-gray-700/50">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            커밋 분석
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {commit.body}
          </p>
        </div>
      )}

      {/* Meta info */}
      <div className="px-5 py-4 border-b border-gray-700/50">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 text-xs">작성자</span>
            <p className="text-gray-300">{commit.author}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">날짜</span>
            <p className="text-gray-300">{formatFullDate(commit.date)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">해시</span>
            <p className="text-gray-300 font-mono text-xs">{commit.hash}</p>
          </div>
          {commit.diffSummary && (
            <div>
              <span className="text-gray-500 text-xs">변경 요약</span>
              <p className="text-gray-300">
                <span className="text-emerald-400">+{commit.diffSummary.totalAdditions}</span>
                {' / '}
                <span className="text-red-400">-{commit.diffSummary.totalDeletions}</span>
                {' '}
                <span className="text-gray-500">({commit.diffSummary.totalFiles}개 파일)</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Changed files */}
      <div className="px-5 py-4 flex-1">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          변경된 파일 ({commit.files.length})
        </h4>
        <ChangeFileList files={commit.files} maxVisible={20} projectId={projectId} commitHash={commit.hash} />
      </div>
    </div>
  );
}
