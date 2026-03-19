import fs from 'node:fs';
import path from 'node:path';

/**
 * 경로를 정규화 - Windows 백슬래시를 처리하고 일관된 형태로 변환
 */
export function normalizePath(inputPath: string): string {
  return path.normalize(inputPath);
}

/**
 * 프로젝트 경로 유효성 검증
 * - 절대 경로인지 확인
 * - 실제 존재하는 디렉토리인지 확인
 */
export function validateProjectPath(inputPath: string): { valid: boolean; error?: string; normalized?: string } {
  const normalized = normalizePath(inputPath);

  // 절대 경로 여부 확인 (Windows 드라이브 문자 포함)
  if (!path.isAbsolute(normalized)) {
    return { valid: false, error: '절대 경로를 입력해주세요.' };
  }

  try {
    const stat = fs.statSync(normalized);
    if (!stat.isDirectory()) {
      return { valid: false, error: '지정된 경로가 디렉토리가 아닙니다.' };
    }
  } catch {
    return { valid: false, error: '경로가 존재하지 않습니다.' };
  }

  return { valid: true, normalized };
}

/**
 * child가 parent 디렉토리 내부에 있는지 확인
 * 디렉토리 트래버설 방지를 위해 사용
 */
export function isSubPath(parent: string, child: string): boolean {
  const normalizedParent = normalizePath(parent);
  const normalizedChild = normalizePath(child);

  // Windows에서 대소문자 구분 없이 비교
  const parentLower = normalizedParent.toLowerCase();
  const childLower = normalizedChild.toLowerCase();

  return childLower.startsWith(parentLower + path.sep) || childLower === parentLower;
}
