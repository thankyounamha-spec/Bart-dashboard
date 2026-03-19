// ============================================================
// 공유 상수 정의
// 프론트/백 양쪽에서 동일하게 사용되는 상수들
// ============================================================

/** 커밋 타입 prefix → CommitType 매핑 */
export const COMMIT_TYPE_MAP: Record<string, string> = {
  feat: 'feat',
  feature: 'feat',
  fix: 'fix',
  refactor: 'refactor',
  docs: 'docs',
  style: 'style',
  chore: 'chore',
  test: 'test',
  perf: 'perf',
  ci: 'chore',
  build: 'chore',
};

/** 커밋 타입별 표시 라벨 */
export const COMMIT_TYPE_LABELS: Record<string, string> = {
  feat: '기능',
  fix: '수정',
  refactor: '리팩토링',
  docs: '문서',
  style: '스타일',
  chore: '기타',
  test: '테스트',
  perf: '성능',
  other: '기타',
};

/** 커밋 타입별 색상 */
export const COMMIT_TYPE_COLORS: Record<string, string> = {
  feat: '#6366f1',
  fix: '#ef4444',
  refactor: '#f59e0b',
  docs: '#3b82f6',
  style: '#8b5cf6',
  chore: '#6b7280',
  test: '#10b981',
  perf: '#f97316',
  other: '#9ca3af',
};

/** 기술 카테고리별 색상 */
export const TECH_CATEGORY_COLORS: Record<string, string> = {
  language: '#3b82f6',
  framework: '#6366f1',
  library: '#8b5cf6',
  database: '#10b981',
  tool: '#f59e0b',
  runtime: '#ef4444',
  other: '#6b7280',
};

/** API 에러 코드 */
export const ERROR_CODES = {
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  GIT_NOT_INITIALIZED: 'GIT_NOT_INITIALIZED',
  SCHEMA_NOT_FOUND: 'SCHEMA_NOT_FOUND',
  INVALID_PATH: 'INVALID_PATH',
  PATH_NOT_EXISTS: 'PATH_NOT_EXISTS',
  PARSE_ERROR: 'PARSE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/** 파일 변경 감지 debounce 시간 (ms) */
export const WATCHER_DEBOUNCE_MS = 1000;

/** 기본 Git log 조회 개수 */
export const DEFAULT_GIT_LOG_LIMIT = 50;

/** API 기본 포트 */
export const DEFAULT_API_PORT = 6173;
export const DEFAULT_FRONTEND_PORT = 6001;
