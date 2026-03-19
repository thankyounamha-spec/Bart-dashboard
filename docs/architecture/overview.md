# 아키텍처 개요

## 시스템 구조

Bart Dashboard는 세 개의 주요 계층으로 구성됩니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Pages    │  │Components│  │ Stores   │  │  Hooks     │  │
│  │(라우팅)  │  │(UI 렌더) │  │(Zustand) │  │(WebSocket, │  │
│  │          │  │          │  │          │  │ Polling)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └──────────────┴─────────────┴──────────────┘         │
│                          │ Axios                             │
├──────────────────────────┼──────────────────────────────────┤
│                    Shared (Types + Constants)                │
├──────────────────────────┼──────────────────────────────────┤
│                          ▼                                   │
│                    Backend (Express + TypeScript)            │
│  ┌───────────┐  ┌────────────┐  ┌─────────────┐            │
│  │Controllers│→ │  Services  │→ │  Analyzers  │            │
│  │(요청 처리)│  │(비즈니스)  │  │  & Parsers  │            │
│  └───────────┘  └─────┬──────┘  └──────┬──────┘            │
│                       │                │                     │
│               ┌───────▼───────┐ ┌──────▼──────┐            │
│               │  JSON 파일    │ │ 로컬 파일   │            │
│               │  (projects)   │ │ (Git, Plan) │            │
│               └───────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Frontend (프론트엔드)

- **기술**: React 18, Vite 5, TypeScript, Tailwind CSS
- **상태 관리**: Zustand (useProjectStore, useDashboardStore)
- **라우팅**: React Router v6
- **실시간 통신**: WebSocket 훅(useWebSocket) + Polling 훅(usePolling) 이중 구조

프론트엔드는 두 개의 주요 페이지로 구성됩니다:
1. **ProjectListPage**: 등록된 프로젝트 목록 표시 및 새 프로젝트 추가
2. **ProjectDashboardPage**: 선택한 프로젝트의 상세 대시보드 (진행률, 타임라인, 기술 스택, ERD)

### Backend (백엔드)

- **기술**: Express 4, TypeScript, Chokidar, ws (WebSocket)
- **계층 구조**: Controller -> Service -> Analyzer/Parser
- **데이터 저장**: JSON 파일 기반 (데이터베이스 미사용)

백엔드는 프로젝트의 로컬 파일 시스템을 직접 분석합니다. Git 명령 실행, 파일 읽기, 스키마 파싱 등 모든 분석이 서버에서 수행됩니다.

### Shared (공유 모듈)

- **shared/types/index.ts**: `ApiResponse`, `Project`, `PlanSummary`, `GitCommit`, `TechStack`, `ErdResult` 등 프론트/백이 동일하게 사용하는 인터페이스
- **shared/constants/index.ts**: 커밋 타입 매핑, 색상, 에러 코드, 기본 포트 등 공유 상수

## 데이터 흐름

### 1. 프로젝트 등록 흐름

```
사용자 → [프로젝트 경로 입력]
  → Frontend (AddProjectModal)
  → POST /api/projects
  → projectController.createProject
  → projectService.createProject
    → pathValidator.validateProjectPath (경로 검증)
    → projects.json에 저장
  → watcherService.watchProject (파일 감시 시작)
  → 응답 반환
```

### 2. 대시보드 데이터 로드 흐름

```
사용자 → [대시보드 페이지 진입]
  → Frontend (ProjectDashboardPage)
  → GET /api/projects/:id/summary
  → projectController.getProjectSummary
    → Promise.all([
        planService.getPlanProgress,     // Plan.md 파싱
        gitService.getStatus,            // Git 상태 조회
        gitService.getLastCommit,        // 최근 커밋 조회
      ])
  → 경고 메시지 생성 (Plan.md 없음, Git 미초기화 등)
  → ProjectSummary 응답
```

### 3. 실시간 업데이트 흐름

```
파일 시스템 변경 (Plan.md 수정, Git 커밋 등)
  → Chokidar (watcherService)
  → classifyChangeType (변경 유형 판별)
  → Debounce (1초)
  → WebSocket broadcast (FileChangeEvent)
  → Frontend (useWebSocket)
  → Zustand store 갱신
  → 해당 컴포넌트 리렌더링
```

### 4. Git 타임라인 흐름

```
GET /api/projects/:id/timeline
  → timelineController.getTimeline
  → gitService.getTimeline
  → gitAnalyzer.getGitLog
    → execFile('git', ['log', ...]) (shell injection 방지)
    → 구분자 기반 파싱 (NUL, SOH 문자 사용)
    → classifyCommitType (Conventional Commits 분류)
  → GitCommit[] 응답
```

## 핵심 설계 결정

### 1. 로컬 파일 기반 분석 (데이터베이스 미사용)

프로젝트 데이터를 데이터베이스에 저장하지 않고, 매 요청마다 로컬 파일을 직접 분석합니다. 이는 설치 부담을 최소화하고, 항상 최신 상태를 보장하기 위한 결정입니다. 프로젝트 등록 정보만 `projects.json` 파일에 저장합니다.

> 상세: [decisions/001-local-file-analysis.md](../decisions/001-local-file-analysis.md)

### 2. execFile 사용 (exec 대신)

Git 명령 실행 시 `child_process.exec` 대신 `child_process.execFile`을 사용합니다. `exec`는 shell을 통해 실행되므로 커밋 메시지에 포함된 특수 문자가 shell injection 공격으로 이어질 수 있습니다. `execFile`은 인자를 배열로 전달하여 이 위험을 원천적으로 차단합니다.

> 상세: [decisions/002-security-git-execfile.md](../decisions/002-security-git-execfile.md)

### 3. Graceful Degradation (우아한 성능 저하)

모든 분석 기능은 데이터가 없을 때 에러를 발생시키지 않고, `null` 또는 빈 결과를 반환합니다. Plan.md가 없어도 대시보드는 정상 작동하며, Git이 초기화되지 않아도 다른 기능은 사용 가능합니다.

> 상세: [decisions/003-graceful-degradation.md](../decisions/003-graceful-degradation.md)

### 4. AMS 통합 준비

Claude CLI 로그 어댑터를 인터페이스 기반으로 설계하여, 향후 AMS(Account Management System) 통합 시 인증/권한 계층을 쉽게 추가할 수 있도록 준비했습니다.

> 상세: [decisions/004-ams-integration-readiness.md](../decisions/004-ams-integration-readiness.md)

## 보안 고려사항

### 경로 보안

- **절대 경로 강제**: 프로젝트 등록 시 상대 경로를 거부합니다.
- **디렉토리 트래버설 방지**: `pathValidator.isSubPath()` 함수로 등록된 프로젝트 경로 외부 접근을 차단합니다.
- **경로 정규화**: Windows 백슬래시를 포함한 다양한 경로 형식을 `path.normalize()`로 통일합니다.

### Git 명령 보안

- **execFile 사용**: shell을 거치지 않고 직접 Git 바이너리를 실행하여 injection 방지
- **커밋 해시 검증**: `getCommitDetail` 및 `getDiffSummary`에서 해시 형식을 정규식(`/^[a-fA-F0-9]{4,40}$/`)으로 검증
- **maxBuffer 제한**: 10MB로 제한하여 대규모 출력에 의한 메모리 고갈 방지

### API 보안

- **표준 에러 응답**: 모든 에러가 `ApiResponse` 형식으로 반환되어 내부 구현이 노출되지 않음
- **CORS 설정**: 개발 환경에서는 모든 origin 허용 (프로덕션 시 제한 필요)

## 파일 감시(File Watching) 동작 방식

### Chokidar 기반 감시

`watcherService.ts`에서 프로젝트별 Chokidar 인스턴스를 관리합니다.

**감시 대상 파일**:
- `Plan.md` (대소문자 변형 포함)
- `.git/HEAD`, `.git/refs/**` (Git 상태 변경 감지)
- `package.json` (의존성 변경)
- `prisma/schema.prisma`, `*.sql` (스키마 변경)

**변경 유형 분류** (`classifyChangeType`):
- `plan`: Plan.md 파일 변경
- `git`: .git 디렉토리 내부 변경 (커밋, 브랜치 전환 등)
- `schema`: .prisma 또는 .sql 파일 변경
- `config`: package.json 등 설정 파일 변경

**Debounce 처리**:
- 동일 유형의 변경이 1초(`WATCHER_DEBOUNCE_MS`) 이내에 반복 발생하면 하나로 묶어 처리
- `awaitWriteFinish` 옵션으로 파일 쓰기 완료 후 이벤트 발생 (500ms 안정화 대기)

### WebSocket 브로드캐스트

파일 변경이 감지되면 `FileChangeEvent` 객체를 모든 WebSocket 클라이언트에 브로드캐스트합니다:

```typescript
interface FileChangeEvent {
  projectId: string;
  changeType: 'plan' | 'git' | 'config' | 'schema';
  timestamp: string;  // ISO 8601
}
```

### Polling Fallback

프론트엔드의 `usePolling` 훅은 WebSocket 연결이 불안정한 환경에서 주기적으로 API를 호출하여 데이터를 갱신합니다.

## 분석기/파서 동작 방식

### Plan Parser (`planParser.ts`)

1. Plan.md 파일을 줄 단위로 읽음
2. `##` 또는 `###` 헤더로 섹션 분리
3. `- [ ]` 또는 `- [x]` 패턴의 체크박스를 감지하여 태스크로 분류
4. 각 섹션별 완료율과 전체 완료율을 계산
5. 섹션 헤더 전에 나오는 태스크는 "(미분류)" 섹션에 할당

### Git Analyzer (`gitAnalyzer.ts`)

1. `execFile`로 Git 명령을 직접 실행 (shell 미사용)
2. `NUL(\x00)`과 `SOH(\x01)` 문자를 구분자로 사용하여 커밋 메시지 내 특수문자와 충돌 방지
3. `--name-status` 옵션으로 변경 파일의 상태(A/M/D/R) 추출
4. Conventional Commits 규칙에 따라 커밋 유형 자동 분류 (`feat:`, `fix:`, `refactor:` 등)
5. `--numstat`으로 파일별 추가/삭제 줄 수 계산

### Stack Detector (`stackDetector.ts`)

4단계 분석을 순차적으로 수행합니다:

1. **package.json 분석**: dependencies/devDependencies에서 알려진 패키지 감지 (React, Express, Zustand 등 90여 개)
2. **락 파일 감지**: yarn.lock, pnpm-lock.yaml 등으로 패키지 매니저 식별
3. **설정 파일 감지**: tsconfig.json, tailwind.config.js 등 50여 개 설정 파일 매핑
4. **파일 확장자 분석**: 루트 및 src 디렉토리의 파일 확장자로 프로그래밍 언어 감지

중복 감지 방지를 위해 `seenNames` Set을 사용합니다.

### Schema Parser (`schemaParser.ts`)

**Prisma 스키마 파싱**:
1. `model` 블록을 정규식으로 추출
2. 각 필드에서 타입, `@id`, `@default`, `@relation` 등 어노테이션 분석
3. 대문자로 시작하는 타입은 관계 모델로 판별 (Prisma 기본 타입 제외)
4. 배열 타입(`[]`)은 역방향 관계로 판단하여 스킵

**SQL 스키마 파싱**:
1. `CREATE TABLE` 문을 정규식으로 추출
2. 각 컬럼의 타입, `PRIMARY KEY`, `NOT NULL`, `DEFAULT`, `REFERENCES` 분석
3. `FOREIGN KEY` 제약조건에서 관계 정보 추출
