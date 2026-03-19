import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { errorHandler } from '../middleware/errorHandler.js';
import routes from '../routes/index.js';
import * as projectService from '../services/projectService.js';
import * as watcherService from '../services/watcherService.js';
import type { FileChangeEvent } from '../types/index.js';

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: true, // 개발 환경에서는 모든 origin 허용
  credentials: true,
}));
app.use(express.json());

// 헬스 체크 엔드포인트
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 라우트 마운트
app.use('/api', routes);

// 전역 에러 핸들러 (라우트 등록 후에 위치해야 함)
app.use(errorHandler);

// HTTP 서버 생성
const server = http.createServer(app);

// WebSocket 서버 설정 - 파일 변경 이벤트를 프론트엔드에 실시간 전달
const wss = new WebSocketServer({ server, path: '/ws' });

/** 연결된 모든 WebSocket 클라이언트에 메시지 브로드캐스트 */
function broadcast(event: FileChangeEvent): void {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  logger.info('WebSocket 클라이언트 연결됨');

  ws.on('close', () => {
    logger.debug('WebSocket 클라이언트 연결 해제');
  });

  ws.on('error', (err) => {
    logger.error('WebSocket 에러', err.message);
  });
});

/** 등록된 프로젝트들에 대해 파일 변경 감시를 시작 */
async function initializeWatchers(): Promise<void> {
  try {
    const projects = await projectService.getProjects();

    for (const project of projects) {
      watcherService.watchProject(project.id, project.path, (changeType) => {
        const event: FileChangeEvent = {
          projectId: project.id,
          changeType,
          timestamp: new Date().toISOString(),
        };
        broadcast(event);
        logger.info(`파일 변경 브로드캐스트: ${project.name} - ${changeType}`);
      });
    }

    logger.info(`${projects.length}개 프로젝트 감시 시작됨`);
  } catch (err) {
    logger.error('Watcher 초기화 실패', err);
  }
}

// 서버 시작 - EADDRINUSE 발생 시 기존 프로세스 안내 메시지 제공
server.listen(config.port, async () => {
  logger.info(`Bart Dashboard 백엔드 서버 시작: http://localhost:${config.port}`);
  logger.info(`WebSocket 경로: ws://localhost:${config.port}/ws`);

  // 서버 시작 후 기존 프로젝트들의 파일 감시 시작
  await initializeWatchers();
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`포트 ${config.port}이 이미 사용 중입니다. 기존 서버를 종료하거나 다른 포트를 사용하세요.`);
    logger.error(`기존 프로세스 종료 명령: netstat -ano | findstr :${config.port} 으로 PID 확인 후 taskkill /F /PID <PID>`);
    process.exit(1);
  } else {
    logger.error('서버 시작 실패', err.message);
    process.exit(1);
  }
});

// Graceful Shutdown - 프로세스 종료 시 리소스 정리
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} 수신 - 서버 종료 시작`);

  // WebSocket 연결 종료
  wss.clients.forEach((client) => {
    client.close();
  });

  // 모든 watcher 정리
  await watcherService.stopAll();

  // HTTP 서버 종료
  server.close(() => {
    logger.info('서버 종료 완료');
    process.exit(0);
  });

  // 5초 후 강제 종료 (안전장치)
  setTimeout(() => {
    logger.error('강제 종료 (타임아웃)');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { app, server };
