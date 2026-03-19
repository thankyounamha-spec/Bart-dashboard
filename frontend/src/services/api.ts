import axios from 'axios';
import type {
  ApiResponse,
  Project,
  ProjectSummary,
  PlanSummary,
  TechStackResult,
  GitCommit,
  GitCommitDetail,
  ErdResult,
  CommitStats,
  FileTreeNode,
  FileDiff,
  GitHubInfo,
  ClaudeLogResult,
  TeamOverview,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to unwrap ApiResponse
api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse;
    if (body.success) {
      return { ...response, data: body.data };
    }
    const errMsg = body.error?.message ?? 'Unknown error';
    return Promise.reject(new Error(errMsg));
  },
  (error) => {
    const msg = error.response?.data?.error?.message || error.message || '알 수 없는 오류';
    const code = error.response?.data?.error?.code || '';
    const endpoint = error.config?.method?.toUpperCase() + ' ' + error.config?.url || '';

    // "데이터 없음" 류의 예상된 404는 토스트에서 제외
    // (Plan.md 없음, 스키마 없음, Git 미초기화 등은 UI에서 별도 처리)
    const SILENT_CODES = ['PLAN_NOT_FOUND', 'SCHEMA_NOT_FOUND', 'GIT_NOT_INITIALIZED', 'COMMIT_NOT_FOUND', 'GITHUB_NOT_AVAILABLE', 'CLAUDE_LOGS_NOT_FOUND'];
    if (!SILENT_CODES.includes(code)) {
      window.dispatchEvent(new CustomEvent('bart:api-error', {
        detail: { message: msg, endpoint, fullDetail: JSON.stringify(error.response?.data || {}) },
      }));
    }

    return Promise.reject(new Error(msg));
  }
);

// ---- API functions ----

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const res = await api.get('/projects');
  return res.data as ProjectSummary[];
}

export async function createProject(
  path: string,
  name?: string
): Promise<Project> {
  const res = await api.post('/projects', { path, name });
  return res.data as Project;
}

export async function fetchProjectSummary(
  projectId: string
): Promise<ProjectSummary> {
  const res = await api.get(`/projects/${projectId}/summary`);
  return res.data as ProjectSummary;
}

export async function fetchPlan(projectId: string): Promise<PlanSummary> {
  const res = await api.get(`/projects/${projectId}/plan`);
  return res.data as PlanSummary;
}

export async function fetchStack(projectId: string): Promise<TechStackResult> {
  const res = await api.get(`/projects/${projectId}/stack`);
  return res.data as TechStackResult;
}

export async function fetchTimeline(projectId: string): Promise<GitCommit[]> {
  const res = await api.get(`/projects/${projectId}/timeline`);
  return res.data as GitCommit[];
}

export async function fetchCommitDetail(
  projectId: string,
  hash: string
): Promise<GitCommitDetail> {
  const res = await api.get(`/projects/${projectId}/timeline/${hash}`);
  return res.data as GitCommitDetail;
}

export async function fetchErd(projectId: string): Promise<ErdResult> {
  const res = await api.get(`/projects/${projectId}/erd`);
  return res.data as ErdResult;
}

export async function reorderProjectsApi(orderedIds: string[]): Promise<void> {
  await api.put('/projects/reorder', { orderedIds });
}

export async function generatePlan(projectId: string): Promise<PlanSummary> {
  const res = await api.post(`/projects/${projectId}/plan/generate`);
  return res.data as PlanSummary;
}

export async function syncProject(
  projectId: string
): Promise<ProjectSummary> {
  const res = await api.post(`/projects/${projectId}/sync`);
  return res.data as ProjectSummary;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

export async function fetchStats(projectId: string): Promise<CommitStats> {
  const res = await api.get(`/projects/${projectId}/stats`);
  return res.data as CommitStats;
}

export async function fetchFileTree(projectId: string): Promise<FileTreeNode[]> {
  const res = await api.get(`/projects/${projectId}/filetree`);
  return res.data as FileTreeNode[];
}

export async function togglePlanTask(
  projectId: string,
  sectionIndex: number,
  taskIndex: number
): Promise<PlanSummary> {
  const res = await api.put(`/projects/${projectId}/plan/toggle`, {
    sectionIndex,
    taskIndex,
  });
  return res.data as PlanSummary;
}

export async function fetchFileDiff(
  projectId: string,
  hash: string,
  filePath: string
): Promise<FileDiff> {
  const encodedPath = encodeURIComponent(filePath);
  const res = await api.get(
    `/projects/${projectId}/timeline/${hash}/diff/${encodedPath}`
  );
  return res.data as FileDiff;
}

export async function fetchGitHubInfo(projectId: string): Promise<GitHubInfo> {
  const res = await api.get(`/projects/${projectId}/github`);
  return res.data as GitHubInfo;
}

export async function fetchClaudeLogs(projectId: string): Promise<ClaudeLogResult> {
  const res = await api.get(`/projects/${projectId}/claude-logs`);
  return res.data as ClaudeLogResult;
}

export async function fetchTeamOverview(): Promise<TeamOverview> {
  const res = await api.get('/team/overview');
  return res.data as TeamOverview;
}
