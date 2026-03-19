import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import type { TeamOverview, AuthorStat, InactiveProject } from '../types/index.js';
import * as projectService from './projectService.js';
import { isGitRepo } from '../analyzers/gitAnalyzer.js';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

async function git(projectPath: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: path.normalize(projectPath),
      maxBuffer: 5 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout;
  } catch {
    return '';
  }
}

/** 팀 전체 모니터링 데이터 수집 */
export async function getTeamOverview(): Promise<TeamOverview> {
  const projects = await projectService.getProjects();

  const authorMap = new Map<string, {
    commitsToday: number;
    commitsWeek: number;
    lastCommitDate: string;
    projects: Set<string>;
  }>();

  let totalCommitsToday = 0;
  let totalCommitsWeek = 0;
  let activeProjects = 0;
  const inactiveProjects: InactiveProject[] = [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const project of projects) {
    const isRepo = await isGitRepo(project.path);
    if (!isRepo) continue;

    // 오늘 커밋 수
    const todayOutput = await git(project.path, [
      'log', '--oneline', `--since=${todayStart}`, '--format=%an',
    ]);
    const todayLines = todayOutput.trim().split('\n').filter(l => l.trim());
    const todayCount = todayLines.length;
    totalCommitsToday += todayCount;

    // 이번주 커밋 수 + 작성자별 통계
    const weekOutput = await git(project.path, [
      'log', `--since=${weekStart}`, '--format=%an\x1f%aI',
    ]);
    const weekLines = weekOutput.trim().split('\n').filter(l => l.trim());
    const weekCount = weekLines.length;
    totalCommitsWeek += weekCount;

    if (weekCount > 0) activeProjects++;

    // 작성자별 집계
    for (const line of todayLines) {
      const author = line.trim();
      if (!author) continue;
      if (!authorMap.has(author)) {
        authorMap.set(author, { commitsToday: 0, commitsWeek: 0, lastCommitDate: '', projects: new Set() });
      }
      authorMap.get(author)!.commitsToday++;
      authorMap.get(author)!.projects.add(project.name);
    }

    for (const line of weekLines) {
      const [author, date] = line.split('\x1f');
      if (!author?.trim()) continue;
      if (!authorMap.has(author)) {
        authorMap.set(author, { commitsToday: 0, commitsWeek: 0, lastCommitDate: '', projects: new Set() });
      }
      const stat = authorMap.get(author)!;
      stat.commitsWeek++;
      stat.projects.add(project.name);
      if (!stat.lastCommitDate || date > stat.lastCommitDate) {
        stat.lastCommitDate = date;
      }
    }

    // 비활성 프로젝트 감지 (3일 이상 커밋 없음)
    const lastCommitOutput = await git(project.path, ['log', '-1', '--format=%aI']);
    const lastCommitDate = lastCommitOutput.trim() || null;
    if (lastCommitDate) {
      const days = Math.floor((now.getTime() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 3) {
        inactiveProjects.push({
          projectId: project.id,
          projectName: project.name,
          lastCommitDate,
          daysSinceLastCommit: days,
        });
      }
    } else {
      inactiveProjects.push({
        projectId: project.id,
        projectName: project.name,
        lastCommitDate: null,
        daysSinceLastCommit: -1,
      });
    }
  }

  const authorStats: AuthorStat[] = Array.from(authorMap.entries())
    .map(([author, stat]) => ({
      author,
      commitsToday: stat.commitsToday,
      commitsWeek: stat.commitsWeek,
      lastCommitDate: stat.lastCommitDate,
      projects: Array.from(stat.projects),
    }))
    .sort((a, b) => b.commitsWeek - a.commitsWeek);

  inactiveProjects.sort((a, b) => b.daysSinceLastCommit - a.daysSinceLastCommit);

  return {
    totalProjects: projects.length,
    activeProjects,
    totalCommitsToday,
    totalCommitsWeek,
    authorStats,
    inactiveProjects,
  };
}
