import type { Request, Response } from 'express';
import type { ApiResponse, ClaudeLogResult } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as claudeLogService from '../services/claudeLogService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';

/** Claude 대화 로그 조회 */
export async function getClaudeLogs(req: Request, res: Response): Promise<void> {
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

  const logs = await claudeLogService.getClaudeLogs(project.path);

  const response: ApiResponse<ClaudeLogResult> = {
    success: true,
    data: logs,
    error: null,
  };

  res.json(response);
}
