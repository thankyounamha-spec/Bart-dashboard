import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as projectController from '../controllers/projectController.js';
import * as planController from '../controllers/planController.js';
import * as timelineController from '../controllers/timelineController.js';
import * as stackController from '../controllers/stackController.js';
import * as erdController from '../controllers/erdController.js';
import * as syncController from '../controllers/syncController.js';
import * as statsController from '../controllers/statsController.js';
import * as fileTreeController from '../controllers/fileTreeController.js';

const router = Router();

// 프로젝트 관리
router.get('/projects', asyncHandler(projectController.listProjects));
router.post('/projects', asyncHandler(projectController.createProject));
router.put('/projects/reorder', asyncHandler(projectController.reorderProjects));
router.get('/projects/:projectId/summary', asyncHandler(projectController.getProjectSummary));
router.delete('/projects/:projectId', asyncHandler(projectController.deleteProject));

// Plan.md 진행률
router.get('/projects/:projectId/plan', asyncHandler(planController.getPlan));
router.post('/projects/:projectId/plan/generate', asyncHandler(planController.generatePlan));
router.put('/projects/:projectId/plan/toggle', asyncHandler(planController.toggleTask));

// 커밋 통계
router.get('/projects/:projectId/stats', asyncHandler(statsController.getStats));

// 파일 트리
router.get('/projects/:projectId/filetree', asyncHandler(fileTreeController.getFileTree));

// 기술 스택
router.get('/projects/:projectId/stack', asyncHandler(stackController.getStack));

// Git 타임라인
router.get('/projects/:projectId/timeline', asyncHandler(timelineController.getTimeline));
router.get('/projects/:projectId/timeline/:commitHash', asyncHandler(timelineController.getCommitDetail));
// 파일 경로에 슬래시가 포함될 수 있으므로 와일드카드(*) 사용
router.get('/projects/:projectId/timeline/:commitHash/diff/*', asyncHandler(timelineController.getFileDiff));

// ERD
router.get('/projects/:projectId/erd', asyncHandler(erdController.getErd));

// 동기화
router.post('/projects/:projectId/sync', asyncHandler(syncController.syncProject));

export default router;
