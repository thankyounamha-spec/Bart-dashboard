// 공유 타입을 재내보내기
export type {
  ApiResponse,
  ApiError,
  Project,
  ProjectCreateRequest,
  ProjectSummary,
  PlanSummary,
  PlanSection,
  PlanTask,
  GitStatus,
  GitCommitSummary,
  CommitType,
  GitCommit,
  GitCommitDetail,
  ChangedFile,
  DiffSummary,
  TechStack,
  TechCategory,
  TechSource,
  TechStackResult,
  ErdResult,
  ErdTable,
  ErdColumn,
  ErdRelation,
  ErdSource,
  DashboardWarning,
  FileChangeEvent,
  CommitStats,
  FileTreeNode,
  FileDiff,
  GitHubInfo,
  GitHubPR,
  GitHubIssue,
  ClaudeConversation,
  ClaudeLogResult,
  TeamOverview,
  AuthorStat,
  InactiveProject,
  SectionHealth,
} from '../../../shared/types/index.js';

// 백엔드 전용 타입

/** 파일 변경 감시 콜백 */
export type WatcherCallback = (changeType: 'plan' | 'git' | 'config' | 'schema') => void;

/** 프로젝트 저장소 데이터 (JSON 파일에 저장되는 형태) */
export interface ProjectStore {
  projects: import('../../../shared/types/index.js').Project[];
}

/** Claude CLI 로그 엔트리 (향후 통합을 위한 인터페이스) */
export interface ClaudeLogEntry {
  timestamp: string;
  type: 'prompt' | 'response' | 'tool_use' | 'error';
  content: string;
  sessionId?: string;
}

/** Claude CLI 로그 어댑터 인터페이스 */
export interface ClaudeLogAdapter {
  /** 주어진 프로젝트 경로의 Claude 로그를 읽어온다 */
  getRecentLogs(projectPath: string, limit?: number): Promise<ClaudeLogEntry[]>;
  /** 어댑터가 사용 가능한 상태인지 확인 */
  isAvailable(): Promise<boolean>;
}
