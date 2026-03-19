import type { TechStackResult } from '../types/index.js';
import { detectTechStack } from '../analyzers/stackDetector.js';
import { logger } from '../utils/logger.js';

/** 프로젝트의 기술 스택을 분석하여 반환 */
export async function getStack(projectPath: string): Promise<TechStackResult> {
  try {
    return await detectTechStack(projectPath);
  } catch (err) {
    logger.error('기술 스택 분석 실패', err);
    // 에러 시에도 빈 결과를 반환하여 API가 깨지지 않도록 함
    return {
      stacks: [],
      analyzedAt: new Date().toISOString(),
    };
  }
}
