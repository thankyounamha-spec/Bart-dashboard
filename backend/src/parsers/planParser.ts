import fs from 'node:fs/promises';
import type { PlanSummary, PlanSection, PlanTask } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * PLAN.md 파일을 파싱하여 체크박스 기반 진행률을 계산
 * 섹션(##, ###)별로 태스크를 분류하고 완료율을 산출
 */
export async function parsePlanFile(filePath: string): Promise<PlanSummary> {
  logger.debug(`Plan 파일 파싱 시작: ${filePath}`);

  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const sections: PlanSection[] = [];
  let currentSection: PlanSection | null = null;

  // 섹션 헤더가 나오기 전의 태스크를 담을 기본 섹션
  let defaultSection: PlanSection = {
    title: '(미분류)',
    totalTasks: 0,
    completedTasks: 0,
    progressPercent: 0,
    tasks: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 섹션 헤더 감지 (## 또는 ###)
    const sectionMatch = trimmed.match(/^#{2,3}\s+(.+)$/);
    if (sectionMatch) {
      // 이전 섹션이 태스크를 가지고 있으면 저장
      if (currentSection && currentSection.tasks.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        title: sectionMatch[1].trim(),
        totalTasks: 0,
        completedTasks: 0,
        progressPercent: 0,
        tasks: [],
      };
      continue;
    }

    // 체크박스 감지 - [ ] 또는 [x] 또는 [X]
    const checkboxMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (checkboxMatch) {
      const completed = checkboxMatch[1].toLowerCase() === 'x';
      const text = checkboxMatch[2].trim();
      const task: PlanTask = { text, completed };

      const target = currentSection || defaultSection;
      target.tasks.push(task);
      target.totalTasks++;
      if (completed) {
        target.completedTasks++;
      }
    }
  }

  // 마지막 섹션 저장
  if (currentSection && currentSection.tasks.length > 0) {
    sections.push(currentSection);
  }

  // 기본 섹션에 태스크가 있으면 맨 앞에 추가
  if (defaultSection.tasks.length > 0) {
    sections.unshift(defaultSection);
  }

  // 각 섹션의 진행률 계산
  for (const section of sections) {
    section.progressPercent = section.totalTasks > 0
      ? Math.round((section.completedTasks / section.totalTasks) * 100)
      : 0;
  }

  // 전체 합계 계산
  const totalTasks = sections.reduce((sum, s) => sum + s.totalTasks, 0);
  const completedTasks = sections.reduce((sum, s) => sum + s.completedTasks, 0);
  const progressPercent = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  logger.debug(`Plan 파싱 완료: ${completedTasks}/${totalTasks} (${progressPercent}%)`);

  return {
    totalTasks,
    completedTasks,
    progressPercent,
    sections,
  };
}
