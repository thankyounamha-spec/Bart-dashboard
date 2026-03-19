import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { logger } from '../utils/logger.js';
import type { ClaudeConversation, ClaudeLogResult } from '../types/index.js';

/** Claude Code 대화 로그 디렉토리 경로 */
function getClaudeProjectsDir(): string {
  const home = os.homedir();
  return path.join(home, '.claude', 'projects');
}

/** 프로젝트 경로를 Claude 프로젝트 디렉토리명으로 변환 */
function projectPathToClaudeDirName(projectPath: string): string {
  // Claude Code는 경로를 - 로 구분하여 디렉토리명으로 사용
  // 예: D:\ClaudeWork\foo → D--ClaudeWork-foo
  return projectPath.replace(/[:/\\]/g, '-').replace(/^-+/, '');
}

/** JSONL 파일에서 대화 요약 추출 */
async function parseConversationFile(filePath: string): Promise<ClaudeConversation | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;

    let messageCount = 0;
    const toolsUsed = new Set<string>();
    let startedAt = '';
    let summary = '';

    for (const line of lines) {
      try {
        const msg = JSON.parse(line);

        // 첫 메시지의 타임스탬프
        if (!startedAt && msg.timestamp) {
          startedAt = msg.timestamp;
        }

        if (msg.type === 'human' || msg.role === 'user') {
          messageCount++;
          // 첫 사용자 메시지를 요약으로 사용
          if (!summary) {
            const text = typeof msg.content === 'string' ? msg.content :
              Array.isArray(msg.content) ? msg.content.find((c: Record<string, unknown>) => c.type === 'text')?.text ?? '' : '';
            summary = text.substring(0, 100);
          }
        }

        if (msg.type === 'assistant' || msg.role === 'assistant') {
          messageCount++;
          // tool_use 블록에서 도구명 추출
          if (Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === 'tool_use' && block.name) {
                toolsUsed.add(block.name);
              }
            }
          }
        }
      } catch {
        // JSON 파싱 실패 무시
      }
    }

    if (messageCount === 0) return null;

    const fileName = path.basename(filePath, path.extname(filePath));

    return {
      id: fileName,
      startedAt: startedAt || new Date().toISOString(),
      messageCount,
      toolsUsed: Array.from(toolsUsed),
      summary: summary || '(내용 없음)',
      filePath: path.basename(filePath),
    };
  } catch {
    return null;
  }
}

/** 프로젝트의 Claude 대화 로그 조회 */
export async function getClaudeLogs(projectPath: string): Promise<ClaudeLogResult> {
  const claudeProjectsDir = getClaudeProjectsDir();
  const dirName = projectPathToClaudeDirName(projectPath);

  // 가능한 경로 패턴들을 시도
  const candidateDirs = [
    path.join(claudeProjectsDir, dirName),
  ];

  // 정확한 이름을 모를 수 있으므로 부분 매칭 시도
  try {
    const entries = await fs.readdir(claudeProjectsDir, { withFileTypes: true });
    const projectName = path.basename(projectPath).toLowerCase();
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.toLowerCase().includes(projectName)) {
        candidateDirs.push(path.join(claudeProjectsDir, entry.name));
      }
    }
  } catch {
    logger.debug('Claude projects 디렉토리를 읽을 수 없습니다');
  }

  const conversations: ClaudeConversation[] = [];
  let foundDir: string | null = null;

  for (const dir of candidateDirs) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      foundDir = dir;

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.jsonl')) {
          const conv = await parseConversationFile(path.join(dir, entry.name));
          if (conv) conversations.push(conv);
        }
      }

      if (conversations.length > 0) break;
    } catch { /* 디렉토리 없음 */ }
  }

  // 최신순 정렬
  conversations.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return {
    conversations: conversations.slice(0, 20),
    totalConversations: conversations.length,
    projectPath: foundDir,
  };
}
