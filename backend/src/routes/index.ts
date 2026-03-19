import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as projectController from '../controllers/projectController.js';
import * as planController from '../controllers/planController.js';
import * as timelineController from '../controllers/timelineController.js';
import * as stackController from '../controllers/stackController.js';
import * as erdController from '../controllers/erdController.js';
import * as syncController from '../controllers/syncController.js';

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

// 기술 스택
router.get('/projects/:projectId/stack', asyncHandler(stackController.getStack));

// Git 타임라인
router.get('/projects/:projectId/timeline', asyncHandler(timelineController.getTimeline));
router.get('/projects/:projectId/timeline/:commitHash', asyncHandler(timelineController.getCommitDetail));

// ERD
router.get('/projects/:projectId/erd', asyncHandler(erdController.getErd));

// 동기화
router.post('/projects/:projectId/sync', asyncHandler(syncController.syncProject));

export default router;
