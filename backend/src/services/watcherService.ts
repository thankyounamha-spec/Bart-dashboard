import path from 'node:path';
import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import type { WatcherCallback } from '../types/index.js';
import { WATCHER_DEBOUNCE_MS } from '../../../shared/constants/index.js';
import { logger } from '../utils/logger.js';

/** 프로젝트별 watcher 인스턴스 관리 */
const watchers = new Map<string, FSWatcher>();

/** 파일 경로에서 변경 타입을 판별 */
function classifyChangeType(filePath: string): 'plan' | 'git' | 'config' | 'schema' {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const basename = path.basename(normalized);

  if (basename === 'plan.md') return 'plan';
  if (normalized.includes('.git/') || normalized.includes('.git\\')) return 'git';
  if (basename.endsWith('.prisma') || basename.endsWith('.sql')) return 'schema';

  // 설정 파일 변경 감지
  const configFiles = [
    'package.json', 'tsconfig.json', '.eslintrc', '.eslintrc.json', '.eslintrc.js',
    'tailwind.config.js', 'tailwind.config.ts', 'vite.config.ts', 'vite.config.js',
    'next.config.js', 'next.config.mjs',
  ];
  if (configFiles.includes(basename)) return 'config';

  return 'config'; // 기본값
}

/**
 * 프로젝트 디렉토리의 주요 파일 변경을 감시
 * PLAN.md, .git, package.json 등의 변경 시 콜백 호출
 */
export function watchProject(projectId: string, projectPath: string, onChange: WatcherCallback): void {
  // 이미 감시 중이면 중복 방지
  if (watchers.has(projectId)) {
    logger.debug(`이미 감시 중인 프로젝트: ${projectId}`);
    return;
  }

  const normalizedPath = path.normalize(projectPath);

  // 감시 대상 패턴 정의
  const watchPaths = [
    path.join(normalizedPath, 'PLAN.md'),
    path.join(normalizedPath, 'plan.md'),
    path.join(normalizedPath, 'PLAN.md'),
    path.join(normalizedPath, '.git', 'HEAD'),
    path.join(normalizedPath, '.git', 'refs', '**'),
    path.join(normalizedPath, 'package.json'),
    path.join(normalizedPath, 'prisma', 'schema.prisma'),
    path.join(normalizedPath, '*.sql'),
  ];

  // debounce 타이머 관리 - 빈번한 변경을 하나로 묶기 위해 사용
  const debounceTimers = new Map<string, NodeJS.Timeout>();

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    persistent: true,
    // Windows에서 안정적인 감지를 위해 polling 사용
    usePolling: false,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('change', (filePath: string) => {
    const changeType = classifyChangeType(filePath);

    // 같은 타입의 변경은 debounce 처리
    const existingTimer = debounceTimers.get(changeType);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      logger.info(`파일 변경 감지: ${changeType} (${path.basename(filePath)})`, { projectId });
      onChange(changeType);
      debounceTimers.delete(changeType);
    }, WATCHER_DEBOUNCE_MS);

    debounceTimers.set(changeType, timer);
  });

  watcher.on('add', (filePath: string) => {
    const changeType = classifyChangeType(filePath);
    logger.debug(`파일 추가 감지: ${path.basename(filePath)}`, { projectId });
    onChange(changeType);
  });

  watcher.on('error', (error: Error) => {
    logger.error(`Watcher 에러 (${projectId}):`, error.message);
  });

  watchers.set(projectId, watcher);
  logger.info(`프로젝트 감시 시작: ${projectId}`);
}

/** 특정 프로젝트의 파일 감시를 중단 */
export async function stopWatching(projectId: string): Promise<void> {
  const watcher = watchers.get(projectId);
  if (watcher) {
    await watcher.close();
    watchers.delete(projectId);
    logger.info(`프로젝트 감시 중단: ${projectId}`);
  }
}

/** 모든 watcher 정리 (graceful shutdown 시 호출) */
export async function stopAll(): Promise<void> {
  const closePromises: Promise<void>[] = [];
  for (const [projectId, watcher] of watchers) {
    logger.debug(`Watcher 정리: ${projectId}`);
    closePromises.push(watcher.close());
  }
  await Promise.all(closePromises);
  watchers.clear();
  logger.info('모든 Watcher 정리 완료');
}
