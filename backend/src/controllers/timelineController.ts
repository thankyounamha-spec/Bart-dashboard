import type { Request, Response } from 'express';
import type { ApiResponse, GitCommit, GitCommitDetail } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as gitService from '../services/gitService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';

/** 커밋 타임라인 조회 */
export async function getTimeline(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

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

  const status = await gitService.getStatus(project.path);
  if (!status.isGitRepo) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: ERROR_CODES.GIT_NOT_INITIALIZED, message: 'Git 저장소가 아닙니다.' },
    };
    res.status(404).json(response);
    return;
  }

  const commits = await gitService.getTimeline(project.path, limit);

  const response: ApiResponse<GitCommit[]> = {
    success: true,
    data: commits,
    error: null,
  };

  res.json(response);
}

/** 특정 커밋 상세 조회 */
export async function getCommitDetail(req: Request, res: Response): Promise<void> {
  const { projectId, commitHash } = req.params;

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

  const detail = await gitService.getCommitDetail(project.path, commitHash);
  if (!detail) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: 'COMMIT_NOT_FOUND', message: '커밋을 찾을 수 없습니다.' },
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<GitCommitDetail> = {
    success: true,
    data: detail,
    error: null,
  };

  res.json(response);
}
