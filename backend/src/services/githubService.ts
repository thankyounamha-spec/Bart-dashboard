import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { logger } from '../utils/logger.js';
import type { GitHubInfo } from '../types/index.js';

const execFileAsync = promisify(execFile);

/** git remote에서 GitHub URL 추출 */
async function getRemoteUrl(projectPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['remote', 'get-url', 'origin'], {
      cwd: path.normalize(projectPath),
      windowsHide: true,
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

/** GitHub owner/repo 추출 */
function parseGitHubUrl(remoteUrl: string): { owner: string; repo: string } | null {
  // HTTPS: https://github.com/owner/repo.git
  let match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/);
  if (match) return { owner: match[1], repo: match[2] };
  // SSH: git@github.com:owner/repo.git
  match = remoteUrl.match(/git@github\.com:([^/]+)\/([^/.]+)(?:\.git)?/);
  if (match) return { owner: match[1], repo: match[2] };
  return null;
}

/** GitHub API 호출 (gh CLI 사용) */
async function ghApi(endpoint: string): Promise<unknown> {
  try {
    const { stdout } = await execFileAsync('gh', ['api', endpoint, '--cache', '60s'], {
      windowsHide: true,
      timeout: 10000,
    });
    return JSON.parse(stdout);
  } catch (err) {
    logger.debug(`gh api 호출 실패: ${endpoint}`, (err as Error).message);
    return null;
  }
}

/** 프로젝트의 GitHub 정보 조회 */
export async function getGitHubInfo(projectPath: string): Promise<GitHubInfo | null> {
  const remoteUrl = await getRemoteUrl(projectPath);
  if (!remoteUrl) return null;

  const parsed = parseGitHubUrl(remoteUrl);
  if (!parsed) return null;

  const { owner, repo } = parsed;
  const repoEndpoint = `repos/${owner}/${repo}`;

  // 병렬로 repo info, PRs, issues 조회
  const [repoData, prsData, issuesData] = await Promise.all([
    ghApi(repoEndpoint) as Promise<Record<string, unknown> | null>,
    ghApi(`${repoEndpoint}/pulls?state=open&per_page=10&sort=updated`) as Promise<unknown[] | null>,
    ghApi(`${repoEndpoint}/issues?state=open&per_page=10&sort=updated`) as Promise<unknown[] | null>,
  ]);

  const result: GitHubInfo = {
    owner,
    repo,
    url: `https://github.com/${owner}/${repo}`,
    stars: 0,
    forks: 0,
    openIssues: 0,
    openPRs: 0,
    pullRequests: [],
    issues: [],
  };

  if (repoData) {
    result.stars = (repoData.stargazers_count as number) ?? 0;
    result.forks = (repoData.forks_count as number) ?? 0;
    result.description = repoData.description as string | undefined;
    result.defaultBranch = repoData.default_branch as string | undefined;
  }

  if (prsData && Array.isArray(prsData)) {
    result.openPRs = prsData.length;
    result.pullRequests = prsData.slice(0, 5).map((pr) => {
      const p = pr as Record<string, unknown>;
      return {
        number: p.number as number,
        title: p.title as string,
        state: p.state as string,
        author: (p.user as Record<string, unknown>)?.login as string,
        updatedAt: p.updated_at as string,
        url: p.html_url as string,
      };
    });
  }

  if (issuesData && Array.isArray(issuesData)) {
    // issues API에는 PR도 포함되므로 PR이 아닌 것만 필터
    const pureIssues = issuesData.filter((i) => !(i as Record<string, unknown>).pull_request);
    result.openIssues = pureIssues.length;
    result.issues = pureIssues.slice(0, 5).map((issue) => {
      const iss = issue as Record<string, unknown>;
      return {
        number: iss.number as number,
        title: iss.title as string,
        state: iss.state as string,
        labels: ((iss.labels as Record<string, unknown>[]) ?? []).map((l) => l.name as string),
        updatedAt: iss.updated_at as string,
        url: iss.html_url as string,
      };
    });
  }

  return result;
}
