import type { Request, Response } from 'express';
import type { ApiResponse, CommitStats } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as statsService from '../services/statsService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';

/** 프로젝트 커밋 통계 조회 */
export async function getStats(req: Request, res: Response): Promise<void> {
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

  const stats = await statsService.getCommitStats(project.path);

  const response: ApiResponse<CommitStats> = {
    success: true,
    data: stats,
    error: null,
  };

  res.json(response);
}
