import path from 'node:path';

// 환경변수에서 설정을 로드하고 기본값을 제공
export const config = {
  /** 서버 포트 */
  port: parseInt(process.env.PORT || '6173', 10),

  /** 로그 레벨 */
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',

  /** 프로젝트 데이터 저장 경로 */
  dataDir: path.resolve(__dirname, '..', '..', 'data'),

  /** 프로젝트 목록 파일 경로 */
  get projectsFile(): string {
    return path.join(this.dataDir, 'projects.json');
  },
} as const;
