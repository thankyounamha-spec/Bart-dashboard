import fs from 'node:fs/promises';
import path from 'node:path';
import type { ErdResult } from '../types/index.js';
import { parsePrismaSchema, parseSqlSchema } from '../parsers/schemaParser.js';
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

  // 추가로 프로젝트 루트에서 .sql 파일 검색
  try {
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.sql') && entry.name !== 'schema.sql') {
        const sqlPath = path.join(normalizedPath, entry.name);
        try {
          const content = await fs.readFile(sqlPath, 'utf-8');
          // CREATE TABLE 문이 포함된 SQL 파일만 파싱
          if (/CREATE\s+TABLE/i.test(content)) {
            logger.info(`SQL 스키마 파일 발견: ${sqlPath}`);
            const result = parseSqlSchema(content);
            result.sourceFile = entry.name;
            return result;
          }
        } catch {
          // 파일 읽기 실패 시 무시
        }
      }
    }
  } catch {
    // 디렉토리 읽기 실패
  }

  logger.debug(`스키마 파일 없음: ${projectPath}`);
  return null;
}
