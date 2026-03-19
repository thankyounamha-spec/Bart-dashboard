import type { Request, Response } from 'express';
import type { ApiResponse, ErdResult } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as erdService from '../services/erdService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';

/** ERD 데이터 조회 */
export async function getErd(req: Request, res: Response): Promise<void> {
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

  const erd = await erdService.getErd(project.path);

  if (!erd) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.SCHEMA_NOT_FOUND,
        message: '스키마 파일을 찾을 수 없습니다. (prisma/schema.prisma 또는 *.sql)',
      },
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<ErdResult> = {
    success: true,
    data: erd,
    error: null,
  };

  res.json(response);
}
