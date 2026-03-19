import { create } from 'zustand';
import type { ProjectSummary } from '@/types';
import { fetchProjects, createProject, reorderProjectsApi, deleteProject as deleteProjectApi } from '@/services/api';

interface ProjectStore {
  projects: ProjectSummary[];
  selectedProject: ProjectSummary | null;
  loading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  addProject: (path: string, name?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (project: ProjectSummary | null) => void;
  reorderProjects: (orderedIds: string[]) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await fetchProjects();
      set({ projects, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '프로젝트 목록을 불러올 수 없습니다',
        loading: false,
      });
    }
  },

  addProject: async (path, name) => {
    set({ loading: true, error: null });
    try {
      await createProject(path, name);
      await get().loadProjects();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '프로젝트를 추가할 수 없습니다',
        loading: false,
      });
      throw err;
    }
  },

  deleteProject: async (projectId) => {
    try {
      await deleteProjectApi(projectId);
      await get().loadProjects();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '프로젝트를 삭제할 수 없습니다',
      });
      throw err;
    }
  },

  selectProject: (project) => {
    set({ selectedProject: project });
  },

  reorderProjects: (orderedIds: string[]) => {
    // 즉시 UI 반영 (낙관적 업데이트)
    const current = get().projects;
    const reordered = orderedIds
      .map((id) => current.find((p) => p.project.id === id))
      .filter(Boolean) as ProjectSummary[];
    set({ projects: reordered });

    // 백엔드에 순서 저장 (실패해도 UI는 유지)
    reorderProjectsApi(orderedIds).catch(() => {
      // 실패 시 원래 순서로 복원
      get().loadProjects();
    });
  },
}));
