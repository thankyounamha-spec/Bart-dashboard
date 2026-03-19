import type { GitCommit, GitCommitDetail, GitStatus, GitCommitSummary } from '../types/index.js';
import * as gitAnalyzer from '../analyzers/gitAnalyzer.js';
import { DEFAULT_GIT_LOG_LIMIT } from '../../../shared/constants/index.js';
import { logger } from '../utils/logger.js';

/** 커밋 타임라인 조회 */
export async function getTimeline(projectPath: string, limit?: number): Promise<GitCommit[]> {
  const isRepo = await gitAnalyzer.isGitRepo(projectPath);
  if (!isRepo) {
    logger.debug(`Git 저장소가 아님: ${projectPath}`);
    return [];
  }

  try {
    return await gitAnalyzer.getGitLog(projectPath, limit || DEFAULT_GIT_LOG_LIMIT);
  } catch (err) {
    logger.error('Git 타임라인 조회 실패', err);
    return [];
  }
}

/** 특정 커밋 상세 조회 */
export async function getCommitDetail(projectPath: string, hash: string): Promise<GitCommitDetail | null> {
  const isRepo = await gitAnalyzer.isGitRepo(projectPath);
  if (!isRepo) {
    return null;
  }

  try {
    return await gitAnalyzer.getCommitDetail(projectPath, hash);
  } catch (err) {
    logger.error(`커밋 상세 조회 실패: ${hash}`, err);
    return null;
  }
}

/** Git 상태 요약 조회 */
export async function getStatus(projectPath: string): Promise<GitStatus> {
  try {
    return await gitAnalyzer.getGitStatus(projectPath);
  } catch (err) {
    logger.error('Git 상태 조회 실패', err);
    return { isGitRepo: false, currentBranch: null, totalCommits: 0 };
  }
}

/** 최근 커밋 요약 조회 */
export async function getLastCommit(projectPath: string): Promise<GitCommitSummary | null> {
  try {
    return await gitAnalyzer.getLastCommit(projectPath);
  } catch (err) {
    logger.error('최근 커밋 조회 실패', err);
    return null;
  }
}
