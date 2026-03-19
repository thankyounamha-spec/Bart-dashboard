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
    if (error.response?.data?.error?.message) {
      return Promise.reject(new Error(error.response.data.error.message));
    }
    return Promise.reject(error);
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
