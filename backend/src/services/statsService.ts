import type { CommitStats } from '../types/index.js';
import * as gitAnalyzer from '../analyzers/gitAnalyzer.js';
import { logger } from '../utils/logger.js';

/** 커밋 로그를 분석하여 통계 데이터를 생성 */
export async function getCommitStats(projectPath: string): Promise<CommitStats> {
  const isRepo = await gitAnalyzer.isGitRepo(projectPath);
  if (!isRepo) {
    return {
      todayCommits: 0,
      weekCommits: 0,
      totalCommits: 0,
      mostActiveHour: null,
      commitsByType: {},
      commitsByDay: [],
    };
  }

  try {
    // 충분한 커밋을 가져와서 통계를 의미 있게 구성
    const commits = await gitAnalyzer.getGitLog(projectPath, 200);
    const now = new Date();

    // 오늘 날짜와 7일 전 기준 계산 (로컬 타임존 기준)
    const todayStr = formatDateLocal(now);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6); // 오늘 포함 7일
    const weekAgoStr = formatDateLocal(weekAgo);

    let todayCommits = 0;
    let weekCommits = 0;
    const hourCounts = new Map<number, number>();
    const typeCounts: Record<string, number> = {};
    const dayCounts = new Map<string, number>();

    // 최근 7일 날짜를 미리 초기화 (커밋이 없는 날도 0으로 표시)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayCounts.set(formatDateLocal(d), 0);
    }

    for (const commit of commits) {
      const commitDate = new Date(commit.date);
      const commitDateStr = formatDateLocal(commitDate);
      const commitHour = commitDate.getHours();

      // 오늘 커밋 수
      if (commitDateStr === todayStr) {
        todayCommits++;
      }

      // 이번 주 커밋 수 (최근 7일)
      if (commitDateStr >= weekAgoStr) {
        weekCommits++;
      }

      // 시간대별 커밋 수 (가장 활동적인 시간 계산용)
      hourCounts.set(commitHour, (hourCounts.get(commitHour) || 0) + 1);

      // 커밋 타입별 분류
      typeCounts[commit.type] = (typeCounts[commit.type] || 0) + 1;

      // 일별 커밋 수 (최근 7일만)
      if (dayCounts.has(commitDateStr)) {
        dayCounts.set(commitDateStr, (dayCounts.get(commitDateStr) || 0) + 1);
      }
    }

    // 가장 활동적인 시간대 찾기
    let mostActiveHour: number | null = null;
    let maxHourCount = 0;
    for (const [hour, count] of hourCounts) {
      if (count > maxHourCount) {
        maxHourCount = count;
        mostActiveHour = hour;
      }
    }

    // 일별 커밋을 배열로 변환 (오래된 날짜부터 정렬)
    const commitsByDay = Array.from(dayCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      todayCommits,
      weekCommits,
      totalCommits: commits.length,
      mostActiveHour,
      commitsByType: typeCounts,
      commitsByDay,
    };
  } catch (err) {
    logger.error('커밋 통계 생성 실패', err);
    return {
      todayCommits: 0,
      weekCommits: 0,
      totalCommits: 0,
      mostActiveHour: null,
      commitsByType: {},
      commitsByDay: [],
    };
  }
}

/** Date를 YYYY-MM-DD 로컬 날짜 문자열로 변환 */
function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
