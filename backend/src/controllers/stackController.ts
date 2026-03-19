import type { Request, Response } from 'express';
import type { ApiResponse, TechStackResult } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as stackService from '../services/stackService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';

/** 기술 스택 조회 */
export async function getStack(req: Request, res: Response): Promise<void> {
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

  const stack = await stackService.getStack(project.path);

  const response: ApiResponse<TechStackResult> = {
    success: true,
    data: stack,
    error: null,
  };

  res.json(response);
}
