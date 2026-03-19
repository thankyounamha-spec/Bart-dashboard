import type { Request, Response } from 'express';
import type { ApiResponse, TeamOverview } from '../types/index.js';
import * as teamService from '../services/teamService.js';

/** 팀 모니터링 개요 조회 */
export async function getTeamOverview(_req: Request, res: Response): Promise<void> {
  const overview = await teamService.getTeamOverview();

  const response: ApiResponse<TeamOverview> = {
    success: true,
    data: overview,
    error: null,
  };

  res.json(response);
}
