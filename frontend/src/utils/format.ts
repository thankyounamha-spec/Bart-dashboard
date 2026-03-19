/**
 * Format an ISO date string as a relative time string in Korean.
 * e.g., "6시간 전", "1일 전", "방금 전"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';

  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffWeek < 5) return `${diffWeek}주 전`;
  if (diffMonth < 12) return `${diffMonth}개월 전`;

  return date.toLocaleDateString('ko-KR');
}

/**
 * Format a full date string for display.
 */
export function formatFullDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const date = new Date(iso);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate a path to maxLen characters, adding ellipsis.
 */
export function formatPath(path: string, maxLen = 30): string {
  if (path.length <= maxLen) return path;
  const start = path.slice(0, 10);
  const end = path.slice(-(maxLen - 13));
  return `${start}...${end}`;
}

/**
 * Format a number as a percentage string.
 */
export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}
