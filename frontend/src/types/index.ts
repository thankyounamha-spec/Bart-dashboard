// Re-export all shared types
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
} from '@shared/types/index';

// Frontend-specific types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

export type CenterView = 'timeline' | 'erd';
