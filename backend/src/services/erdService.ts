import fs from 'node:fs/promises';
import path from 'node:path';
import type { ErdResult } from '../types/index.js';
import { parsePrismaSchema, parseSqlSchema, parseTypeOrmEntities } from '../parsers/schemaParser.js';
import { logger } from '../utils/logger.js';

/** 스키마 파일 탐색 후보 목록 (우선순위 순) */
const SCHEMA_CANDIDATES = [
  { path: 'prisma/schema.prisma', parser: 'prisma' as const },
  { path: 'prisma/schema', parser: 'prisma' as const },
  { path: 'schema.prisma', parser: 'prisma' as const },
  { path: 'db/schema.sql', parser: 'sql' as const },
  { path: 'database/schema.sql', parser: 'sql' as const },
  { path: 'sql/schema.sql', parser: 'sql' as const },
  { path: 'schema.sql', parser: 'sql' as const },
  { path: 'migrations/schema.sql', parser: 'sql' as const },
];

/**
 * 프로젝트에서 스키마 파일을 탐색하고 파싱하여 ERD 데이터 반환
 * 스키마 파일이 없으면 null 반환
 */
export async function getErd(projectPath: string): Promise<ErdResult | null> {
  const normalizedPath = path.normalize(projectPath);

  // 후보 파일을 순서대로 탐색
  for (const candidate of SCHEMA_CANDIDATES) {
    const schemaPath = path.join(normalizedPath, candidate.path);
    try {
      const content = await fs.readFile(schemaPath, 'utf-8');
      logger.info(`스키마 파일 발견: ${schemaPath}`);

      let result: ErdResult;
      if (candidate.parser === 'prisma') {
        result = parsePrismaSchema(content);
      } else {
        result = parseSqlSchema(content);
      }

      result.sourceFile = candidate.path;
      return result;
    } catch {
      // 해당 후보 파일 없음 - 다음으로 진행
    }
  }

  // 프로젝트 루트 및 주요 하위 디렉토리에서 .sql 파일 검색
  const sqlSearchDirs = [normalizedPath];
  try {
    const rootEntries = await fs.readdir(normalizedPath, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        sqlSearchDirs.push(path.join(normalizedPath, entry.name));
      }
    }
  } catch { /* 무시 */ }

  // 모든 DDL 내용을 합쳐서 파싱 (여러 SQL 파일에 테이블이 분산될 수 있음)
  let combinedSql = '';
  let foundSqlFile = '';

  for (const dir of sqlSearchDirs) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.sql')) {
          const sqlPath = path.join(dir, entry.name);
          try {
            const content = await fs.readFile(sqlPath, 'utf-8');
            if (/CREATE\s+TABLE/i.test(content)) {
              const relPath = path.relative(normalizedPath, sqlPath);
              logger.debug(`SQL DDL 파일 발견: ${relPath}`);
              combinedSql += '\n' + content;
              if (!foundSqlFile) foundSqlFile = relPath;
            }
          } catch { /* 파일 읽기 실패 무시 */ }
        }
      }
    } catch { /* 디렉토리 읽기 실패 무시 */ }
  }

  if (combinedSql) {
    const result = parseSqlSchema(combinedSql);
    result.sourceFile = foundSqlFile;
    return result;
  }

  // TypeORM entity 파일 탐색 (*.entity.ts, *.entity.js)
  const entityFiles: { path: string; content: string }[] = [];
  const entitySearchDirs = [
    path.join(normalizedPath, 'src'),
    path.join(normalizedPath, 'src', 'entities'),
    path.join(normalizedPath, 'src', 'entity'),
    path.join(normalizedPath, 'entities'),
    path.join(normalizedPath, 'entity'),
    normalizedPath,
  ];

  for (const dir of entitySearchDirs) {
    try {
      await scanForEntityFiles(dir, normalizedPath, entityFiles);
    } catch { /* 디렉토리 없음 무시 */ }
  }

  if (entityFiles.length > 0) {
    logger.info(`TypeORM entity 파일 ${entityFiles.length}개 발견`);
    const result = parseTypeOrmEntities(entityFiles);
    if (result.tables.length > 0) {
      result.sourceFile = entityFiles[0].path;
      return result;
    }
  }

  logger.debug(`스키마 파일 없음: ${projectPath}`);
  return null;
}

/** 디렉토리에서 *.entity.ts/js 파일을 재귀적으로 탐색 (최대 3depth) */
async function scanForEntityFiles(
  dir: string,
  basePath: string,
  result: { path: string; content: string }[],
  depth = 0,
): Promise<void> {
  if (depth > 3) return;
  const seenPaths = new Set(result.map(f => f.path));

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.entity\.(ts|js)$/.test(entry.name)) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(basePath, fullPath);
        if (seenPaths.has(relPath)) continue;
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          if (content.includes('@Entity')) {
            result.push({ path: relPath, content });
          }
        } catch { /* 읽기 실패 무시 */ }
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await scanForEntityFiles(path.join(dir, entry.name), basePath, result, depth + 1);
      }
    }
  } catch { /* 디렉토리 읽기 실패 무시 */ }
}
