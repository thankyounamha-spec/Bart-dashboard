import type { ClaudeLogAdapter, ClaudeLogEntry } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Claude CLI 로그 어댑터의 No-op 구현
 * 실제 Claude CLI 통합이 구현되기 전까지 빈 결과를 반환
 *
 * 향후 구현 시:
 * - Claude CLI의 로그 파일 위치를 탐색
 * - 프로젝트별 세션 로그를 파싱
 * - 프롬프트/응답/도구 사용 내역을 구조화
 */
class NoopClaudeLogAdapter implements ClaudeLogAdapter {
  async getRecentLogs(_projectPath: string, _limit?: number): Promise<ClaudeLogEntry[]> {
    logger.debug('Claude 로그 어댑터: No-op 구현 - 빈 결과 반환');
    return [];
  }

  async isAvailable(): Promise<boolean> {
    // 실제 구현 시 Claude CLI 설치 여부를 확인
    return false;
  }
}

/** 기본 내보내기 - 실제 어댑터 구현 시 이 인스턴스를 교체 */
export const claudeLogAdapter: ClaudeLogAdapter = new NoopClaudeLogAdapter();
