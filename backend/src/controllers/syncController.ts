import type { Request, Response } from 'express';
import type { ApiResponse, ProjectSummary, DashboardWarning } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as planService from '../services/planService.js';
import * as gitService from '../services/gitService.js';
import * as stackService from '../services/stackService.js';
import * as erdService from '../services/erdService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';
import { logger } from '../utils/logger.js';

/** 프로젝트의 모든 데이터를 재분석하여 최신 상태로 동기화 */
export async function syncProject(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  const project = await projectService.getProject(projectId);
  if (!project) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: ERROR_CODES.PROJECT_NOT_FOUND, message: '프로젝트를 찾을 수 없습니다.' },
    };
    res.status(404).json(response);
    return;
  }

  logger.info(`프로젝트 전체 동기화 시작: ${project.name} (${projectId})`);

  // 모든 분석을 병렬로 수행
  const [plan, gitStatus, lastCommit, stack, erd] = await Promise.all([
    planService.getPlanProgress(project.path),
    gitService.getStatus(project.path),
    gitService.getLastCommit(project.path),
    stackService.getStack(project.path),
    erdService.getErd(project.path),
  ]);

  // lastSyncedAt 갱신
  await projectService.updateLastSynced(projectId);

  // 경고 메시지 생성
  const warnings: DashboardWarning[] = [];

  if (!plan) {
    warnings.push({
      type: 'info',
      code: ERROR_CODES.PLAN_NOT_FOUND,
      message: 'PLAN.md 파일이 없습니다.',
    });
  }

  if (!gitStatus.isGitRepo) {
    warnings.push({
      type: 'warning',
      code: ERROR_CODES.GIT_NOT_INITIALIZED,
      message: 'Git 저장소가 초기화되지 않았습니다.',
    });
  }

  if (!erd) {
    warnings.push({
      type: 'info',
      code: ERROR_CODES.SCHEMA_NOT_FOUND,
      message: '스키마 파일을 찾을 수 없습니다.',
    });
  }

  // 업데이트된 프로젝트 정보 재조회 (lastSyncedAt 반영)
  const updatedProject = await projectService.getProject(projectId);

  const summary: ProjectSummary = {
    project: updatedProject || project,
    plan,
    gitStatus,
    lastCommit,
    warnings,
  };

  logger.info(`프로젝트 동기화 완료: ${project.name}`);

  const response: ApiResponse<ProjectSummary & { stack: typeof stack; erd: typeof erd }> = {
    success: true,
    data: { ...summary, stack, erd },
    error: null,
  };

  res.json(response);
}
