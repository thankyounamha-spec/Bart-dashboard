import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { GitStatus, GitCommit, GitCommitDetail, GitCommitSummary, ChangedFile, DiffSummary, CommitType } from '../types/index.js';
import { COMMIT_TYPE_MAP } from '../../../shared/constants/index.js';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

/** execFile 래퍼 - Windows 경로 정규화와 에러 처리를 통합 */
async function git(projectPath: string, args: string[]): Promise<string> {
  const normalizedPath = path.normalize(projectPath);
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: normalizedPath,
      maxBuffer: 10 * 1024 * 1024, // 10MB - 대규모 diff 대응
      windowsHide: true,
    });
    return stdout;
  } catch (err: unknown) {
    const error = err as Error & { stderr?: string };
    logger.debug(`git 명령 실행 실패: git ${args.join(' ')}`, error.message);
    throw error;
  }
}

/** .git 디렉토리 존재 여부로 Git 저장소인지 확인 */
export async function isGitRepo(projectPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(path.normalize(projectPath), '.git'));
    return true;
  } catch {
    return false;
  }
}

/** 커밋 메시지에서 커밋 타입을 분류 (conventional commits 기반) */
export function classifyCommitType(message: string): CommitType {
  // "feat:", "fix(scope):" 같은 conventional commit 패턴 감지
  const match = message.match(/^(\w+)(?:\([^)]*\))?[!]?:\s*/);
  if (match) {
    const prefix = match[1].toLowerCase();
    const mapped = COMMIT_TYPE_MAP[prefix];
    if (mapped) {
      return mapped as CommitType;
    }
  }
  return 'other';
}

/** git log 파싱 - 각 커밋을 개별 명령으로 안전하게 분리 */
export async function getGitLog(projectPath: string, limit: number = 50): Promise<GitCommit[]> {
  // body에 개행/특수문자가 포함되면 구분자 파싱이 깨지므로
  // body를 제외하고 커밋 목록을 먼저 가져온 뒤, name-status를 별도로 파싱
  const SEP = '\x1f'; // Unit Separator - 커밋 메시지에 나올 확률이 거의 없음
  const RECORD_SEP = '\x1e'; // Record Separator

  // body 제외: hash, hashShort, subject, date, author만 가져옴
  const format = [`%H`, `%h`, `%s`, `%aI`, `%an`].join(SEP) + RECORD_SEP;
  const output = await git(projectPath, [
    'log',
    `--max-count=${limit}`,
    `--format=${format}`,
  ]);

  // 변경 파일 목록은 별도 명령으로 조회 (body 개행 간섭 방지)
  let nameStatusOutput = '';
  try {
    nameStatusOutput = await git(projectPath, [
      'log',
      `--max-count=${limit}`,
      '--format=%x1e%H',
      '--name-status',
    ]);
  } catch {
    logger.debug('name-status 조회 실패 - 파일 목록 없이 진행');
  }

  // name-status를 해시별로 매핑
  const filesByHash = new Map<string, ChangedFile[]>();
  if (nameStatusOutput) {
    const nsRecords = nameStatusOutput.split(RECORD_SEP).filter(r => r.trim());
    for (const nsRecord of nsRecords) {
      const nsLines = nsRecord.trim().split('\n');
      if (nsLines.length === 0) continue;
      const nsHash = nsLines[0].trim();
      if (!nsHash || nsHash.length < 4) continue;

      const files: ChangedFile[] = [];
      for (let i = 1; i < nsLines.length; i++) {
        const fileLine = nsLines[i].trim();
        if (!fileLine) continue;
        const fileMatch = fileLine.match(/^([AMDRC])\d*\t(.+?)(?:\t(.+))?$/);
        if (fileMatch) {
          const statusChar = fileMatch[1];
          const filePath = fileMatch[3] || fileMatch[2];
          let status: ChangedFile['status'];
          switch (statusChar) {
            case 'A': status = 'added'; break;
            case 'D': status = 'deleted'; break;
            case 'R': status = 'renamed'; break;
            case 'C': status = 'added'; break;
            default: status = 'modified'; break;
          }
          files.push({ path: filePath, status });
        }
      }
      filesByHash.set(nsHash, files);
    }
  }

  // 커밋 목록 파싱
  const commits: GitCommit[] = [];
  const records = output.split(RECORD_SEP).filter(r => r.trim());

  for (const record of records) {
    const trimmed = record.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(SEP);
    if (parts.length < 5) continue;

    const [hash, hashShort, subject, date, author] = parts;
    const type = classifyCommitType(subject);
    const files = filesByHash.get(hash) || [];

    commits.push({
      hash,
      hashShort,
      subject,
      body: '', // body는 상세 조회 시 개별적으로 가져옴
      date,
      author,
      type,
      files,
    });
  }

  return commits;
}

/** 특정 커밋의 상세 정보와 diff 요약을 함께 조회 */
export async function getCommitDetail(projectPath: string, hash: string): Promise<GitCommitDetail> {
  // 해시 값 안전성 검증 - shell injection 방지를 위한 추가 방어
  if (!/^[a-fA-F0-9]{4,40}$/.test(hash)) {
    throw new Error('유효하지 않은 커밋 해시입니다.');
  }

  const SEP = '\x1f';

  // body 제외하여 파싱 안정성 확보, body는 별도 조회
  const format = [`%H`, `%h`, `%s`, `%aI`, `%an`].join(SEP);
  const output = await git(projectPath, ['show', '--format=' + format, '--name-status', hash]);

  const lines = output.split('\n');
  const parts = lines[0].split(SEP);

  if (parts.length < 5) {
    throw new Error('커밋 정보 파싱 실패');
  }

  const [commitHash, hashShort, subject, date, author] = parts;
  const type = classifyCommitType(subject);

  // body 별도 조회
  let body = '';
  try {
    body = (await git(projectPath, ['log', '-1', '--format=%b', hash])).trim();
  } catch {
    logger.debug('커밋 body 조회 실패');
  }

  // diff summary 조회
  const diffSummary = await getDiffSummary(projectPath, hash);

  // name-status에서 파일 목록 추출
  const files: ChangedFile[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fileLine = lines[i].trim();
    if (!fileLine) continue;

    // diff 출력 시작 시 중단
    if (fileLine.startsWith('diff --git')) break;

    const fileMatch = fileLine.match(/^([AMDRC])\d*\t(.+?)(?:\t(.+))?$/);
    if (fileMatch) {
      const statusChar = fileMatch[1];
      const filePath = fileMatch[3] || fileMatch[2];
      let status: ChangedFile['status'];
      switch (statusChar) {
        case 'A': status = 'added'; break;
        case 'D': status = 'deleted'; break;
        case 'R': status = 'renamed'; break;
        default: status = 'modified'; break;
      }

      // diffSummary에서 해당 파일의 additions/deletions 매칭
      const diffFile = diffSummary?.files.find(f => f.path === filePath);
      files.push({
        path: filePath,
        status,
        additions: diffFile?.additions,
        deletions: diffFile?.deletions,
      });
    }
  }

  return {
    hash: commitHash,
    hashShort,
    subject,
    body,
    date,
    author,
    type,
    files,
    diffSummary,
  };
}

/** 커밋의 파일별 추가/삭제 줄 수 요약 */
export async function getDiffSummary(projectPath: string, hash: string): Promise<DiffSummary | null> {
  if (!/^[a-fA-F0-9]{4,40}$/.test(hash)) {
    throw new Error('유효하지 않은 커밋 해시입니다.');
  }

  try {
    const output = await git(projectPath, ['diff', '--numstat', `${hash}~1`, hash]);

    const files: ChangedFile[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    const lines = output.trim().split('\n').filter(l => l.trim());
    for (const line of lines) {
      const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
      if (match) {
        const additions = match[1] === '-' ? 0 : parseInt(match[1], 10);
        const deletions = match[2] === '-' ? 0 : parseInt(match[2], 10);
        const filePath = match[3];

        totalAdditions += additions;
        totalDeletions += deletions;

        files.push({
          path: filePath,
          status: 'modified', // numstat에서는 상세 status 구분 불가
          additions,
          deletions,
        });
      }
    }

    return {
      totalFiles: files.length,
      totalAdditions,
      totalDeletions,
      files,
    };
  } catch {
    // 첫 커밋은 부모가 없으므로 diff 실패 가능
    logger.debug(`diff 실패 (첫 커밋일 수 있음): ${hash}`);
    return null;
  }
}

/** 현재 브랜치와 전체 커밋 수 조회 */
export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  const isRepo = await isGitRepo(projectPath);
  if (!isRepo) {
    return { isGitRepo: false, currentBranch: null, totalCommits: 0 };
  }

  let currentBranch: string | null = null;
  let totalCommits = 0;

  try {
    const branchOutput = await git(projectPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
    currentBranch = branchOutput.trim();
  } catch {
    logger.debug('현재 브랜치 조회 실패');
  }

  try {
    const countOutput = await git(projectPath, ['rev-list', '--count', 'HEAD']);
    totalCommits = parseInt(countOutput.trim(), 10) || 0;
  } catch {
    logger.debug('커밋 수 조회 실패');
  }

  return { isGitRepo: true, currentBranch, totalCommits };
}

/** 최근 커밋 요약 정보 조회 */
export async function getLastCommit(projectPath: string): Promise<GitCommitSummary | null> {
  try {
    const isRepo = await isGitRepo(projectPath);
    if (!isRepo) return null;

    const SEP = '\x00';
    const format = [`%H`, `%s`, `%aI`, `%an`].join(SEP);
    const output = await git(projectPath, ['log', '-1', `--format=${format}`]);

    const parts = output.trim().split(SEP);
    if (parts.length < 4) return null;

    return {
      hash: parts[0],
      subject: parts[1],
      date: parts[2],
      author: parts[3],
    };
  } catch {
    return null;
  }
}
