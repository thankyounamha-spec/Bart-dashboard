import { create } from 'zustand';
import type {
  ProjectSummary,
  PlanSummary,
  TechStackResult,
  GitCommit,
  GitCommitDetail,
  ErdResult,
  LoadingState,
} from '@/types';
import {
  fetchProjectSummary,
  fetchPlan,
  fetchStack,
  fetchTimeline,
  fetchCommitDetail,
  fetchErd,
  syncProject,
} from '@/services/api';

interface DashboardStore {
  // Data
  summary: ProjectSummary | null;
  plan: PlanSummary | null;
  stack: TechStackResult | null;
  timeline: GitCommit[];
  erd: ErdResult | null;
  selectedCommit: GitCommitDetail | null;

  // Loading states
  summaryState: LoadingState;
  planState: LoadingState;
  stackState: LoadingState;
  timelineState: LoadingState;
  erdState: LoadingState;
  commitDetailState: LoadingState;
  syncState: LoadingState;

  // Errors
  summaryError: string | null;
  planError: string | null;
  stackError: string | null;
  timelineError: string | null;
  erdError: string | null;
  commitDetailError: string | null;

  // Actions
  loadAll: (projectId: string) => Promise<void>;
  loadSummary: (projectId: string) => Promise<void>;
  loadPlan: (projectId: string) => Promise<void>;
  loadStack: (projectId: string) => Promise<void>;
  loadTimeline: (projectId: string) => Promise<void>;
  loadErd: (projectId: string) => Promise<void>;
  selectCommit: (projectId: string, hash: string) => Promise<void>;
  clearSelectedCommit: () => void;
  sync: (projectId: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  summary: null,
  plan: null,
  stack: null,
  timeline: [],
  erd: null,
  selectedCommit: null,
  summaryState: 'idle' as LoadingState,
  planState: 'idle' as LoadingState,
  stackState: 'idle' as LoadingState,
  timelineState: 'idle' as LoadingState,
  erdState: 'idle' as LoadingState,
  commitDetailState: 'idle' as LoadingState,
  syncState: 'idle' as LoadingState,
  summaryError: null,
  planError: null,
  stackError: null,
  timelineError: null,
  erdError: null,
  commitDetailError: null,
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  ...initialState,

  loadAll: async (projectId) => {
    const { loadSummary, loadPlan, loadStack, loadTimeline, loadErd } = get();
    await Promise.allSettled([
      loadSummary(projectId),
      loadPlan(projectId),
      loadStack(projectId),
      loadTimeline(projectId),
      loadErd(projectId),
    ]);
  },

  loadSummary: async (projectId) => {
    set({ summaryState: 'loading', summaryError: null });
    try {
      const summary = await fetchProjectSummary(projectId);
      set({ summary, summaryState: 'success' });
    } catch (err) {
      set({
        summaryState: 'error',
        summaryError: err instanceof Error ? err.message : '요약 정보를 불러올 수 없습니다',
      });
    }
  },

  loadPlan: async (projectId) => {
    set({ planState: 'loading', planError: null });
    try {
      const plan = await fetchPlan(projectId);
      set({ plan, planState: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // PLAN.md가 없는 것은 에러가 아니라 "데이터 없음" 상태로 처리
      if (msg.includes('PLAN.md') || msg.includes('찾을 수 없습니다')) {
        set({ plan: null, planState: 'success', planError: null });
      } else {
        set({ planState: 'error', planError: msg || '플랜을 불러올 수 없습니다' });
      }
    }
  },

  loadStack: async (projectId) => {
    set({ stackState: 'loading', stackError: null });
    try {
      const stack = await fetchStack(projectId);
      set({ stack, stackState: 'success' });
    } catch (err) {
      set({
        stackState: 'error',
        stackError: err instanceof Error ? err.message : '기술 스택을 불러올 수 없습니다',
      });
    }
  },

  loadTimeline: async (projectId) => {
    set({ timelineState: 'loading', timelineError: null });
    try {
      const timeline = await fetchTimeline(projectId);
      set({ timeline, timelineState: 'success' });
    } catch (err) {
      set({
        timelineState: 'error',
        timelineError: err instanceof Error ? err.message : '타임라인을 불러올 수 없습니다',
      });
    }
  },

  loadErd: async (projectId) => {
    set({ erdState: 'loading', erdError: null });
    try {
      const erd = await fetchErd(projectId);
      set({ erd, erdState: 'success' });
    } catch (err) {
      set({
        erdState: 'error',
        erdError: err instanceof Error ? err.message : 'ERD를 불러올 수 없습니다',
      });
    }
  },

  selectCommit: async (projectId, hash) => {
    set({ commitDetailState: 'loading', commitDetailError: null });
    try {
      const detail = await fetchCommitDetail(projectId, hash);
      set({ selectedCommit: detail, commitDetailState: 'success' });
    } catch (err) {
      set({
        commitDetailState: 'error',
        commitDetailError:
          err instanceof Error ? err.message : '커밋 상세를 불러올 수 없습니다',
      });
    }
  },

  clearSelectedCommit: () => {
    set({ selectedCommit: null, commitDetailState: 'idle', commitDetailError: null });
  },

  sync: async (projectId) => {
    set({ syncState: 'loading' });
    try {
      const summary = await syncProject(projectId);
      set({ summary, syncState: 'success' });
      // Reload all data after sync
      await get().loadAll(projectId);
    } catch {
      set({ syncState: 'error' });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
