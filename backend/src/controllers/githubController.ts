import type { Request, Response } from 'express';
import type { ApiResponse, GitHubInfo } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as githubService from '../services/githubService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';

/** GitHub 정보 조회 */
export async function getGitHubInfo(req: Request, res: Response): Promise<void> {
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

  const info = await githubService.getGitHubInfo(project.path);

  if (!info) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: 'GITHUB_NOT_AVAILABLE', message: 'GitHub remote가 설정되지 않았거나 gh CLI가 없습니다.' },
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<GitHubInfo> = {
    success: true,
    data: info,
    error: null,
  };

  res.json(response);
}
