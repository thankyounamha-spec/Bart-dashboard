import { create } from 'zustand';
import type { ProjectSummary } from '@/types';
import { fetchProjects, createProject } from '@/services/api';

interface ProjectStore {
  projects: ProjectSummary[];
  selectedProject: ProjectSummary | null;
  loading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  addProject: (path: string, name?: string) => Promise<void>;
  selectProject: (project: ProjectSummary | null) => void;
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
      // Reload full list after adding
      await get().loadProjects();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '프로젝트를 추가할 수 없습니다',
        loading: false,
      });
      throw err;
    }
  },

  selectProject: (project) => {
    set({ selectedProject: project });
  },
}));
