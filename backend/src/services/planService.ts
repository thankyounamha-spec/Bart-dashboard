import fs from 'node:fs/promises';
import path from 'node:path';
import type { PlanSummary } from '../types/index.js';
import { parsePlanFile } from '../parsers/planParser.js';
import * as gitAnalyzer from '../analyzers/gitAnalyzer.js';
import { logger } from '../utils/logger.js';

/**
 * 프로젝트의 PLAN.md 파일에서 진행률을 조회
 * PLAN.md가 없는 경우 null 반환 (에러 대신 graceful 처리)
 */
export async function getPlanProgress(projectPath: string): Promise<PlanSummary | null> {
  // PLAN.md 파일 탐색 - 대소문자 변형도 확인
  const candidates = ['PLAN.md', 'Plan.md', 'plan.md', 'PLAN.MD'];

  for (const candidate of candidates) {
    const planPath = path.join(path.normalize(projectPath), candidate);
    try {
      await fs.access(planPath);
      logger.debug(`Plan 파일 발견: ${planPath}`);
      return await parsePlanFile(planPath);
    } catch {
      // 해당 파일명으로 없으면 다음 후보 시도
    }
  }

  logger.debug(`Plan 파일 없음: ${projectPath}`);
  return null;
}

/**
 * 프로젝트의 git log와 파일 구조를 기반으로 PLAN.md를 자동 생성
 * 커밋 메시지를 분석하여 기능 섹션과 체크박스를 구성
 */
export async function generatePlan(projectPath: string, projectName: string): Promise<PlanSummary> {
  const normalizedPath = path.normalize(projectPath);
  const planPath = path.join(normalizedPath, 'PLAN.md');

  // 이미 PLAN.md가 있으면 기존 것 반환
  try {
    await fs.access(planPath);
    const existing = await parsePlanFile(planPath);
    if (existing) return existing;
  } catch {
    // PLAN.md 없음 — 새로 생성
  }

  // git log에서 커밋 메시지를 수집하여 기능 항목 추출
  const sections = new Map<string, string[]>();

  try {
    const isRepo = await gitAnalyzer.isGitRepo(normalizedPath);
    if (isRepo) {
      const commits = await gitAnalyzer.getGitLog(normalizedPath, 100);

      for (const commit of commits) {
        const sectionName = getSectionName(commit.type);
        if (!sections.has(sectionName)) {
          sections.set(sectionName, []);
        }
        // 커밋 prefix 제거하여 깔끔한 항목명 생성
        const taskName = commit.subject.replace(/^(\w+)(\([^)]*\))?[!]?:\s*/, '');
        const tasks = sections.get(sectionName)!;
        // 중복 방지
        if (!tasks.includes(taskName)) {
          tasks.push(taskName);
        }
      }
    }
  } catch (err) {
    logger.warn('Plan 생성을 위한 git log 분석 실패', err);
  }

  // 커밋이 없으면 기본 템플릿 생성
  if (sections.size === 0) {
    sections.set('1. 프로젝트 설정', ['프로젝트 초기 구성']);
    sections.set('2. 핵심 기능', ['주요 기능 구현']);
    sections.set('3. UI/UX', ['화면 구현']);
    sections.set('4. 테스트 및 배포', ['테스트 작성', '배포 설정']);
  }

  // PLAN.md 내용 생성
  let content = `# ${projectName} 개발 계획\n\n`;
  content += `## 프로젝트 개요\n${projectName} 프로젝트\n\n`;
  content += `## 주요 기능\n\n`;

  for (const [section, tasks] of sections) {
    content += `### ${section}\n`;
    for (const task of tasks) {
      content += `- [x] ${task}\n`;
    }
    content += '\n';
  }

  await fs.writeFile(planPath, content, 'utf-8');
  logger.info(`PLAN.md 자동 생성 완료: ${planPath}`);

  const result = await parsePlanFile(planPath);
  return result!;
}

/** 커밋 타입을 섹션명으로 매핑 */
function getSectionName(type: string): string {
  switch (type) {
    case 'feat': return '1. 기능 구현';
    case 'fix': return '2. 버그 수정';
    case 'refactor': return '3. 리팩토링';
    case 'docs': return '4. 문서';
    case 'style': return '5. 스타일/UI';
    case 'test': return '6. 테스트';
    case 'perf': return '7. 성능 개선';
    default: return '8. 기타 작업';
  }
}
