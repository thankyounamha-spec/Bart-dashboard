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

/**
 * PLAN.md 파일의 특정 체크박스를 토글
 * sectionIndex와 taskIndex로 대상 태스크를 식별하여 [ ] <-> [x] 전환
 */
export async function toggleTask(
  projectPath: string,
  sectionIndex: number,
  taskIndex: number,
): Promise<PlanSummary> {
  const normalizedPath = path.normalize(projectPath);

  // PLAN.md 파일 경로 찾기
  const candidates = ['PLAN.md', 'Plan.md', 'plan.md', 'PLAN.MD'];
  let planPath: string | null = null;

  for (const candidate of candidates) {
    const candidatePath = path.join(normalizedPath, candidate);
    try {
      await fs.access(candidatePath);
      planPath = candidatePath;
      break;
    } catch {
      // 다음 후보 시도
    }
  }

  if (!planPath) {
    const err = new Error('PLAN.md 파일을 찾을 수 없습니다.') as Error & { statusCode?: number; code?: string };
    err.statusCode = 404;
    err.code = 'PLAN_NOT_FOUND';
    throw err;
  }

  const content = await fs.readFile(planPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  // 섹션과 태스크를 순회하며 대상 체크박스의 줄 번호를 찾음
  let currentSectionIdx = -1;
  let currentTaskIdx = -1;
  let targetLineIdx = -1;
  // 섹션 헤더 전 태스크가 있을 수 있으므로 -1부터 시작 (미분류 섹션)
  let hasSeenSection = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // 섹션 헤더 감지
    const sectionMatch = trimmed.match(/^#{2,3}\s+(.+)$/);
    if (sectionMatch) {
      // 이전 섹션에 태스크가 있었으면 섹션 인덱스 증가
      if (hasSeenSection || currentTaskIdx >= 0) {
        // 첫 섹션이 아닌 경우에만 증가
      }
      currentSectionIdx++;
      currentTaskIdx = -1;
      hasSeenSection = true;
      continue;
    }

    // 체크박스 감지
    const checkboxMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (checkboxMatch) {
      // 섹션 헤더 전 태스크는 sectionIndex 0으로 취급
      const effectiveSectionIdx = hasSeenSection ? currentSectionIdx : 0;
      currentTaskIdx++;

      if (effectiveSectionIdx === sectionIndex && currentTaskIdx === taskIndex) {
        targetLineIdx = i;
        break;
      }
    }
  }

  if (targetLineIdx === -1) {
    const err = new Error('해당 태스크를 찾을 수 없습니다.') as Error & { statusCode?: number; code?: string };
    err.statusCode = 400;
    err.code = 'INVALID_PATH';
    throw err;
  }

  // 체크박스 토글: [ ] -> [x], [x] -> [ ], [X] -> [ ]
  const line = lines[targetLineIdx];
  if (/\[[ ]\]/.test(line)) {
    lines[targetLineIdx] = line.replace('[ ]', '[x]');
  } else {
    lines[targetLineIdx] = line.replace(/\[[xX]\]/, '[ ]');
  }

  // 원본 파일의 줄바꿈 형식 유지
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  await fs.writeFile(planPath, lines.join(lineEnding), 'utf-8');
  logger.info(`PLAN.md 태스크 토글: section=${sectionIndex}, task=${taskIndex}`);

  // 변경된 PLAN.md를 다시 파싱하여 최신 상태 반환
  return (await parsePlanFile(planPath))!;
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
