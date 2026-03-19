// ============================================================
// 공유 타입 정의
// 프론트엔드와 백엔드가 동일한 데이터 구조를 사용하기 위한 타입들
// ============================================================

/** 표준 API 응답 구조 - 모든 API가 이 형식을 따른다 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

/** 프로젝트 등록 정보 */
export interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: string;      // ISO 8601
  lastSyncedAt: string | null;
}

export interface ProjectCreateRequest {
  path: string;
  name?: string;
}

/** 프로젝트 요약 정보 - Dashboard 메인 카드에 표시 */
export interface ProjectSummary {
  project: Project;
  plan: PlanSummary | null;
  gitStatus: GitStatus | null;
  lastCommit: GitCommitSummary | null;
  warnings: DashboardWarning[];
}

/** PLAN.md 파싱 결과 */
export interface PlanSummary {
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  sections: PlanSection[];
}

export interface PlanSection {
  title: string;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  tasks: PlanTask[];
}

export interface PlanTask {
  text: string;
  completed: boolean;
}

/** Git 관련 타입 */
export interface GitStatus {
  isGitRepo: boolean;
  currentBranch: string | null;
  totalCommits: number;
}

export interface GitCommitSummary {
  hash: string;
  subject: string;
  date: string;
  author: string;
}

export type CommitType = 'feat' | 'fix' | 'refactor' | 'docs' | 'style' | 'chore' | 'test' | 'perf' | 'other';

export interface GitCommit {
  hash: string;
  hashShort: string;
  subject: string;
  body: string;
  date: string;           // ISO 8601
  author: string;
  type: CommitType;
  files: ChangedFile[];
}

export interface GitCommitDetail extends GitCommit {
  diffSummary: DiffSummary | null;
}

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions?: number;
  deletions?: number;
}

export interface DiffSummary {
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  files: ChangedFile[];
}

/** 기술 스택 */
export interface TechStack {
  name: string;
  version: string | null;
  category: TechCategory;
  source: TechSource;       // 어디서 감지했는지
  sourceFile: string;       // 감지 근거 파일
}

export type TechCategory = 'language' | 'framework' | 'library' | 'database' | 'tool' | 'runtime' | 'other';
export type TechSource = 'packageJson' | 'lockFile' | 'configFile' | 'fileExtension' | 'dockerfile' | 'inferred';

export interface TechStackResult {
  stacks: TechStack[];
  analyzedAt: string;
}

/** ERD 관련 */
export interface ErdResult {
  tables: ErdTable[];
  relations: ErdRelation[];
  source: ErdSource;
  sourceFile: string | null;
}

export interface ErdTable {
  name: string;
  columns: ErdColumn[];
}

export interface ErdColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  defaultValue?: string;
  relationTo?: string;     // 관계 대상 테이블
}

export interface ErdRelation {
  from: string;            // 테이블명
  to: string;              // 테이블명
  fromColumn: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export type ErdSource = 'prisma' | 'typeorm' | 'sql' | 'manual' | 'none';

/** Dashboard 경고/안내 */
export interface DashboardWarning {
  type: 'info' | 'warning' | 'error';
  code: string;
  message: string;
}

/** 파일 변경 이벤트 (WebSocket용) */
export interface FileChangeEvent {
  projectId: string;
  changeType: 'plan' | 'git' | 'config' | 'schema';
  timestamp: string;
}

/** 커밋 통계 - 대시보드 통계 위젯용 */
export interface CommitStats {
  todayCommits: number;
  weekCommits: number;
  totalCommits: number;
  mostActiveHour: number | null;
  commitsByType: Record<string, number>;
  commitsByDay: Array<{ date: string; count: number }>;
}

/** 파일 트리 노드 - 프로젝트 구조 시각화용 */
export interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  extension?: string;
  children?: FileTreeNode[];
  size?: number;
}

/** 파일 diff 결과 - 커밋 상세의 파일별 변경 내용 */
export interface FileDiff {
  filePath: string;
  diff: string;
  truncated: boolean;
}

/** GitHub 연동 정보 */
export interface GitHubInfo {
  owner: string;
  repo: string;
  url: string;
  description?: string;
  defaultBranch?: string;
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  pullRequests: GitHubPR[];
  issues: GitHubIssue[];
}

export interface GitHubPR {
  number: number;
  title: string;
  state: string;
  author: string;
  updatedAt: string;
  url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  labels: string[];
  updatedAt: string;
  url: string;
}

/** Claude 로그 대화 요약 */
export interface ClaudeConversation {
  id: string;
  startedAt: string;
  messageCount: number;
  toolsUsed: string[];
  summary: string;
  filePath: string;
}

export interface ClaudeLogResult {
  conversations: ClaudeConversation[];
  totalConversations: number;
  projectPath: string | null;
}

/** 팀 모니터링 요약 */
export interface TeamOverview {
  totalProjects: number;
  activeProjects: number;
  totalCommitsToday: number;
  totalCommitsWeek: number;
  authorStats: AuthorStat[];
  inactiveProjects: InactiveProject[];
}

export interface AuthorStat {
  author: string;
  commitsToday: number;
  commitsWeek: number;
  lastCommitDate: string;
  projects: string[];
}

export interface InactiveProject {
  projectId: string;
  projectName: string;
  lastCommitDate: string | null;
  daysSinceLastCommit: number;
}

/** 대시보드 섹션 상태 */
export interface SectionHealth {
  section: string;
  status: 'ok' | 'loading' | 'error' | 'empty';
  message?: string;
  lastUpdated?: string;
}
