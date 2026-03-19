import type { Request, Response } from 'express';
import type { ApiResponse, Project, ProjectSummary, DashboardWarning } from '../types/index.js';
import * as projectService from '../services/projectService.js';
import * as planService from '../services/planService.js';
import * as gitService from '../services/gitService.js';
import * as stackService from '../services/stackService.js';
import { ERROR_CODES } from '../../../shared/constants/index.js';
import { logger } from '../utils/logger.js';

/** 등록된 프로젝트 목록 조회 - 각 프로젝트의 요약 정보를 함께 반환 */
export async function listProjects(_req: Request, res: Response): Promise<void> {
  const projects = await projectService.getProjects();

  // 각 프로젝트의 plan/git 정보를 병렬로 수집하여 ProjectSummary[] 반환
  const summaries: ProjectSummary[] = await Promise.all(
    projects.map(async (project) => {
      try {
        const [plan, gitStatus, lastCommit] = await Promise.all([
          planService.getPlanProgress(project.path).catch(() => null),
          gitService.getStatus(project.path).catch(() => ({ isGitRepo: false, currentBranch: null, totalCommits: 0 })),
          gitService.getLastCommit(project.path).catch(() => null),
        ]);

        const warnings: DashboardWarning[] = [];
        if (!plan) {
          warnings.push({ type: 'info', code: ERROR_CODES.PLAN_NOT_FOUND, message: 'PLAN.md 파일이 없습니다.' });
        }
        if (!gitStatus.isGitRepo) {
          warnings.push({ type: 'warning', code: ERROR_CODES.GIT_NOT_INITIALIZED, message: 'Git 저장소가 초기화되지 않았습니다.' });
        }

        return { project, plan, gitStatus, lastCommit, warnings };
      } catch {
        // 개별 프로젝트 분석 실패 시에도 목록에서 제외하지 않음
        return {
          project,
          plan: null,
          gitStatus: { isGitRepo: false, currentBranch: null, totalCommits: 0 },
          lastCommit: null,
          warnings: [{ type: 'error' as const, code: ERROR_CODES.INTERNAL_ERROR, message: '프로젝트 분석 중 오류가 발생했습니다.' }],
        };
      }
    })
  );

  const response: ApiResponse<ProjectSummary[]> = {
    success: true,
    data: summaries,
    error: null,
  };

  res.json(response);
}

/** 새 프로젝트 등록 */
export async function createProject(req: Request, res: Response): Promise<void> {
  const { path: projectPath, name } = req.body;

  if (!projectPath || typeof projectPath !== 'string') {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: ERROR_CODES.INVALID_PATH, message: '프로젝트 경로를 입력해주세요.' },
    };
    res.status(400).json(response);
    return;
  }

  const project = await projectService.createProject(projectPath, name);

  const response: ApiResponse<Project> = {
    success: true,
    data: project,
    error: null,
  };

  res.status(201).json(response);
}

/** 프로젝트 요약 정보 조회 - 대시보드 메인 카드에 표시될 데이터 */
export async function getProjectSummary(req: Request, res: Response): Promise<void> {
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

  // 각 분석을 병렬로 실행하여 응답 속도 향상
  const [plan, gitStatus, lastCommit] = await Promise.all([
    planService.getPlanProgress(project.path),
    gitService.getStatus(project.path),
    gitService.getLastCommit(project.path),
  ]);

  // 경고 메시지 생성
  const warnings: DashboardWarning[] = [];

  if (!plan) {
    warnings.push({
      type: 'info',
      code: ERROR_CODES.PLAN_NOT_FOUND,
      message: 'PLAN.md 파일이 없습니다. 진행률 추적을 위해 PLAN.md를 작성해보세요.',
    });
  }

  if (!gitStatus.isGitRepo) {
    warnings.push({
      type: 'warning',
      code: ERROR_CODES.GIT_NOT_INITIALIZED,
      message: 'Git 저장소가 초기화되지 않았습니다.',
    });
  }

  const summary: ProjectSummary = {
    project,
    plan,
    gitStatus,
    lastCommit,
    warnings,
  };

  const response: ApiResponse<ProjectSummary> = {
    success: true,
    data: summary,
    error: null,
  };

  res.json(response);
}

/** 프로젝트 순서 변경 */
export async function reorderProjects(req: Request, res: Response): Promise<void> {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: ERROR_CODES.INVALID_PATH, message: '순서 데이터가 유효하지 않습니다.' },
    };
    res.status(400).json(response);
    return;
  }

  await projectService.reorderProjects(orderedIds);

  const response: ApiResponse<{ reordered: boolean }> = {
    success: true,
    data: { reordered: true },
    error: null,
  };

  res.json(response);
}

/** 프로젝트 삭제 */
export async function deleteProject(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const deleted = await projectService.deleteProject(projectId);

  if (!deleted) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: ERROR_CODES.PROJECT_NOT_FOUND, message: '프로젝트를 찾을 수 없습니다.' },
    };
    res.status(404).json(response);
    return;
  }

  logger.info(`프로젝트 삭제됨: ${projectId}`);

  const response: ApiResponse<{ deleted: boolean }> = {
    success: true,
    data: { deleted: true },
    error: null,
  };

  res.json(response);
}
