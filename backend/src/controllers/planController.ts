import type { Request, Response } from 'express';
import type { ApiResponse, PlanSummary } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as planService from '../services/planService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';

/** PLAN.md 진행률 조회 */
export async function getPlan(req: Request, res: Response): Promise<void> {
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

  const plan = await planService.getPlanProgress(project.path);

  if (!plan) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: ERROR_CODES.PLAN_NOT_FOUND, message: 'PLAN.md 파일을 찾을 수 없습니다.' },
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<PlanSummary> = {
    success: true,
    data: plan,
    error: null,
  };

  res.json(response);
}

/** PLAN.md 태스크 체크박스 토글 */
export async function toggleTask(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { sectionIndex, taskIndex } = req.body;

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

  // sectionIndex, taskIndex 유효성 검증
  if (typeof sectionIndex !== 'number' || typeof taskIndex !== 'number' || sectionIndex < 0 || taskIndex < 0) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: ERROR_CODES.INVALID_PATH, message: 'sectionIndex와 taskIndex는 0 이상의 정수여야 합니다.' },
    };
    res.status(400).json(response);
    return;
  }

  const plan = await planService.toggleTask(project.path, sectionIndex, taskIndex);

  const response: ApiResponse<PlanSummary> = {
    success: true,
    data: plan,
    error: null,
  };

  res.json(response);
}

/** PLAN.md 자동 생성 - 프로젝트의 git log 기반으로 생성 */
export async function generatePlan(req: Request, res: Response): Promise<void> {
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

  const plan = await planService.generatePlan(project.path, project.name);

  const response: ApiResponse<PlanSummary> = {
    success: true,
    data: plan,
    error: null,
  };

  res.status(201).json(response);
}
