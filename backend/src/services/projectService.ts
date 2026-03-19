import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectStore } from '../types/index.js';
import { config } from '../config/index.js';
import { validateProjectPath } from '../utils/pathValidator.js';
import { logger } from '../utils/logger.js';

/** 데이터 디렉토리와 프로젝트 파일이 존재하는지 확인하고 없으면 생성 */
async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(config.dataDir, { recursive: true });
  } catch {
    // 이미 존재하면 무시
  }

  try {
    await fs.access(config.projectsFile);
  } catch {
    // 파일이 없으면 빈 저장소로 초기화
    const initial: ProjectStore = { projects: [] };
    await fs.writeFile(config.projectsFile, JSON.stringify(initial, null, 2), 'utf-8');
    logger.info(`프로젝트 저장 파일 생성: ${config.projectsFile}`);
  }
}

/** 프로젝트 목록을 파일에서 읽기 */
async function readStore(): Promise<ProjectStore> {
  await ensureDataFile();
  const content = await fs.readFile(config.projectsFile, 'utf-8');
  return JSON.parse(content) as ProjectStore;
}

/** 프로젝트 목록을 파일에 쓰기 */
async function writeStore(store: ProjectStore): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(config.projectsFile, JSON.stringify(store, null, 2), 'utf-8');
}

/** 새 프로젝트 등록 */
export async function createProject(projectPath: string, name?: string): Promise<Project> {
  const validation = validateProjectPath(projectPath);
  if (!validation.valid) {
    const err = new Error(validation.error || '유효하지 않은 경로') as Error & { statusCode?: number; code?: string };
    err.statusCode = 400;
    err.code = 'INVALID_PATH';
    throw err;
  }

  const normalizedPath = validation.normalized!;
  const store = await readStore();

  // 이미 등록된 경로인지 확인 (중복 방지)
  const existing = store.projects.find(
    p => path.normalize(p.path).toLowerCase() === normalizedPath.toLowerCase()
  );
  if (existing) {
    const err = new Error('이미 등록된 프로젝트 경로입니다.') as Error & { statusCode?: number; code?: string };
    err.statusCode = 409;
    err.code = 'DUPLICATE_PROJECT';
    throw err;
  }

  // 이름이 제공되지 않으면 디렉토리명 사용
  const projectName = name || path.basename(normalizedPath);

  const project: Project = {
    id: uuidv4(),
    name: projectName,
    path: normalizedPath,
    createdAt: new Date().toISOString(),
    lastSyncedAt: null,
  };

  store.projects.push(project);
  await writeStore(store);

  logger.info(`프로젝트 등록 완료: ${project.name} (${project.id})`);
  return project;
}

/** 등록된 모든 프로젝트 조회 */
export async function getProjects(): Promise<Project[]> {
  const store = await readStore();
  return store.projects;
}

/** ID로 프로젝트 단건 조회 */
export async function getProject(id: string): Promise<Project | null> {
  const store = await readStore();
  return store.projects.find(p => p.id === id) || null;
}

/** 프로젝트 삭제 */
export async function deleteProject(id: string): Promise<boolean> {
  const store = await readStore();
  const index = store.projects.findIndex(p => p.id === id);

  if (index === -1) {
    return false;
  }

  const removed = store.projects.splice(index, 1)[0];
  await writeStore(store);

  logger.info(`프로젝트 삭제 완료: ${removed.name} (${removed.id})`);
  return true;
}

/** 프로젝트 순서 변경 */
export async function reorderProjects(orderedIds: string[]): Promise<void> {
  const store = await readStore();
  const reordered = orderedIds
    .map((id) => store.projects.find((p) => p.id === id))
    .filter(Boolean) as Project[];
  // orderedIds에 없는 프로젝트는 뒤에 붙임
  const remaining = store.projects.filter((p) => !orderedIds.includes(p.id));
  store.projects = [...reordered, ...remaining];
  await writeStore(store);
  logger.info(`프로젝트 순서 변경: ${orderedIds.join(', ')}`);
}

/** lastSyncedAt 업데이트 */
export async function updateLastSynced(id: string): Promise<void> {
  const store = await readStore();
  const project = store.projects.find(p => p.id === id);
  if (project) {
    project.lastSyncedAt = new Date().toISOString();
    await writeStore(store);
  }
}
