import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileTreeNode } from '../types/index.js';
import { logger } from '../utils/logger.js';

/** 탐색 시 제외할 디렉토리 목록 - 불필요한 대용량 폴더를 건너뛰기 위함 */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.venv',
  'coverage',
]);

/** 재귀 탐색 최대 깊이 - 성능과 응답 크기를 제한 */
const MAX_DEPTH = 4;

/** 프로젝트 디렉토리를 재귀 스캔하여 파일 트리 구조를 반환 */
export async function getFileTree(projectPath: string): Promise<FileTreeNode[]> {
  const normalizedPath = path.normalize(projectPath);

  try {
    return await scanDirectory(normalizedPath, normalizedPath, 0);
  } catch (err) {
    logger.error('파일 트리 스캔 실패', err);
    return [];
  }
}

/** 디렉토리를 재귀적으로 스캔 */
async function scanDirectory(
  dirPath: string,
  rootPath: string,
  depth: number,
): Promise<FileTreeNode[]> {
  if (depth >= MAX_DEPTH) {
    return [];
  }

  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    // 접근 권한이 없거나 존재하지 않는 디렉토리
    return [];
  }

  const directories: FileTreeNode[] = [];
  const files: FileTreeNode[] = [];

  for (const entry of entries) {
    const entryName = entry.name;

    // 숨김 파일/폴더도 .git 이외에는 포함 (dotfile 설정 파일 등)
    if (SKIP_DIRS.has(entryName)) {
      continue;
    }

    const fullPath = path.join(dirPath, entryName);
    // 프로젝트 루트 기준 상대 경로를 사용하여 프론트엔드에서 표시하기 편하게 함
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const children = await scanDirectory(fullPath, rootPath, depth + 1);
      directories.push({
        name: entryName,
        type: 'directory',
        path: relativePath,
        children,
      });
    } else if (entry.isFile()) {
      const ext = path.extname(entryName);
      let size: number | undefined;

      try {
        const stat = await fs.stat(fullPath);
        size = stat.size;
      } catch {
        // stat 실패 시 size 생략
      }

      files.push({
        name: entryName,
        type: 'file',
        path: relativePath,
        extension: ext || undefined,
        size,
      });
    }
  }

  // 디렉토리 먼저, 그 다음 파일 - 알파벳 순 정렬
  directories.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  return [...directories, ...files];
}
