import type { ErdTable, ErdColumn, ErdRelation, ErdResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Prisma 스키마 파일 파싱
 * model 블록에서 테이블, 컬럼, 관계를 추출
 */
export function parsePrismaSchema(content: string): ErdResult {
  logger.debug('Prisma 스키마 파싱 시작');

  const tables: ErdTable[] = [];
  const relations: ErdRelation[] = [];

  // model 블록 추출
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let modelMatch: RegExpExecArray | null;

  while ((modelMatch = modelRegex.exec(content)) !== null) {
    const modelName = modelMatch[1];
    const body = modelMatch[2];
    const columns: ErdColumn[] = [];

    const lines = body.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
        continue;
      }

      // 필드 파싱: fieldName Type modifiers
      const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)(.*)$/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      let fieldType = fieldMatch[2];
      const modifiers = fieldMatch[3] || '';

      // Prisma 관계 필드 감지 (타입이 다른 모델을 참조)
      const isArray = fieldType.endsWith('[]');
      const isOptional = fieldType.endsWith('?');
      const cleanType = fieldType.replace(/[\[\]?]/g, '');

      const isPrimaryKey = modifiers.includes('@id');
      const isNullable = isOptional;
      const isForeignKey = modifiers.includes('@relation') || /Id$/.test(fieldName);

      // @default 값 추출
      const defaultMatch = modifiers.match(/@default\(([^)]+)\)/);
      const defaultValue = defaultMatch ? defaultMatch[1] : undefined;

      // 관계 감지: 타입이 대문자로 시작하면 관계 모델로 간주
      let relationTo: string | undefined;
      if (/^[A-Z]/.test(cleanType) && cleanType !== 'String' && cleanType !== 'Int' &&
          cleanType !== 'Float' && cleanType !== 'Boolean' && cleanType !== 'DateTime' &&
          cleanType !== 'Json' && cleanType !== 'BigInt' && cleanType !== 'Decimal' &&
          cleanType !== 'Bytes') {
        relationTo = cleanType;

        // 관계 추가 (배열이 아닌 경우만 - 배열은 역방향 관계)
        if (!isArray) {
          relations.push({
            from: modelName,
            to: cleanType,
            fromColumn: fieldName,
            toColumn: 'id',
            type: 'one-to-many',
          });
        }

        // 관계 필드는 실제 DB 컬럼이 아니므로 스킵
        continue;
      }

      columns.push({
        name: fieldName,
        type: fieldType,
        isPrimaryKey,
        isForeignKey,
        isNullable,
        defaultValue,
        relationTo,
      });
    }

    tables.push({ name: modelName, columns });
  }

  logger.debug(`Prisma 파싱 완료: ${tables.length}개 테이블, ${relations.length}개 관계`);

  return {
    tables,
    relations,
    source: 'prisma',
    sourceFile: null,
  };
}

/**
 * SQL CREATE TABLE 문 파싱
 * 표준 SQL 구문에서 테이블과 컬럼 정보를 추출
 */
export function parseSqlSchema(content: string): ErdResult {
  logger.debug('SQL 스키마 파싱 시작');

  const tables: ErdTable[] = [];
  const relations: ErdRelation[] = [];

  // CREATE TABLE 문 추출 — 한글/특수문자 테이블명, MySQL ENGINE 절 대응
  // 마지막 닫는 괄호 `)` 앞까지를 body로 추출 (MySQL의 ) ENGINE=... 대응)
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?([^`"'\s(]+)[`"']?\s*\(([\s\S]*?)\)\s*(?:ENGINE|DEFAULT|;|\n\n)/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(content)) !== null) {
    const tableName = tableMatch[1];
    const body = tableMatch[2];
    const columns: ErdColumn[] = [];

    // 컬럼 정의를 줄 단위로 분리
    const columnDefs = body.split(',').map(s => s.trim()).filter(s => s.length > 0);

    for (const colDef of columnDefs) {
      const trimmed = colDef.trim();

      // 제약조건 라인은 스킵 (PRIMARY KEY, FOREIGN KEY, INDEX 등)
      if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|INDEX|KEY|CONSTRAINT|CHECK)/i.test(trimmed)) {
        // FOREIGN KEY 제약에서 관계 추출
        const fkMatch = trimmed.match(
          /FOREIGN\s+KEY\s*\([`"']?(\w+)[`"']?\)\s*REFERENCES\s+[`"']?(\w+)[`"']?\s*\([`"']?(\w+)[`"']?\)/i
        );
        if (fkMatch) {
          relations.push({
            from: tableName,
            to: fkMatch[2],
            fromColumn: fkMatch[1],
            toColumn: fkMatch[3],
            type: 'one-to-many',
          });
        }
        continue;
      }

      // 일반 컬럼 파싱: column_name TYPE modifiers — 한글 컬럼명도 지원
      const colMatch = trimmed.match(/^[`"']?([^`"'\s]+)[`"']?\s+(\w+(?:\([^)]*\))?)\s*(.*)?$/i);
      if (!colMatch) continue;

      const colName = colMatch[1];
      const colType = colMatch[2];
      const modifiers = (colMatch[3] || '').toUpperCase();

      const isPrimaryKey = modifiers.includes('PRIMARY KEY');
      const isNullable = !modifiers.includes('NOT NULL') && !isPrimaryKey;
      const isForeignKey = modifiers.includes('REFERENCES');

      // DEFAULT 값 추출
      const defaultMatch = modifiers.match(/DEFAULT\s+(\S+)/i);
      const defaultValue = defaultMatch ? defaultMatch[1] : undefined;

      // REFERENCES 관계 추출
      let relationTo: string | undefined;
      const refMatch = modifiers.match(/REFERENCES\s+[`"']?(\w+)[`"']?/i);
      if (refMatch) {
        relationTo = refMatch[1];
        const refColMatch = modifiers.match(/REFERENCES\s+\w+\s*\([`"']?(\w+)[`"']?\)/i);
        relations.push({
          from: tableName,
          to: refMatch[1],
          fromColumn: colName,
          toColumn: refColMatch ? refColMatch[1] : 'id',
          type: 'one-to-many',
        });
      }

      columns.push({
        name: colName,
        type: colType,
        isPrimaryKey,
        isForeignKey,
        isNullable,
        defaultValue,
        relationTo,
      });
    }

    tables.push({ name: tableName, columns });
  }

  logger.debug(`SQL 파싱 완료: ${tables.length}개 테이블, ${relations.length}개 관계`);

  return {
    tables,
    relations,
    source: 'sql',
    sourceFile: null,
  };
}
