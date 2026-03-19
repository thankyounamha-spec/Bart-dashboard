# Bart Dashboard

Claude Code CLI 기반 개발 프로젝트의 진행 상황을 실시간으로 시각화하는 Vibe Dashboard

## 소개

이 프로젝트는 Claude Code가 생성하는 코드의 진행 상황을 한눈에 파악할 수 있도록 설계된 대시보드입니다. 개발자가 Claude Code CLI를 사용하여 코드를 작성하는 동안, 대시보드는 프로젝트의 전반적인 상태를 실시간으로 모니터링하고 시각화합니다.

데이터베이스 없이 로컬 파일 시스템을 직접 분석하는 방식으로 동작하며, 별도의 설정 없이 프로젝트 경로만 등록하면 바로 사용할 수 있습니다.

### 주요 기능

- **Plan.md 기반 진행률 실시간 추적**: Plan.md 파일의 체크박스(`- [x]`, `- [ ]`)를 파싱하여 전체 및 섹션별 진행률을 자동 계산합니다.
- **Git 커밋 타임라인 시각화**: 커밋 이력을 타임라인 형태로 표시하며, Conventional Commits 규칙에 따라 커밋 유형(feat, fix, refactor 등)을 자동 분류합니다.
- **기술 스택 자동 분석**: package.json, 설정 파일, 파일 확장자 등을 종합 분석하여 프로젝트에서 사용하는 기술 스택을 자동으로 감지합니다.
- **ERD(Entity Relationship Diagram) 시각화**: Prisma 스키마 또는 SQL 파일을 파싱하여 테이블 구조와 관계를 시각적으로 표시합니다.
- **파일 변경 내역 추적**: 각 커밋에서 변경된 파일 목록과 추가/삭제 줄 수를 확인할 수 있습니다.
- **실시간 파일 감시**: Chokidar를 이용한 파일 변경 감지와 WebSocket을 통한 실시간 업데이트를 지원합니다.

### 사용 시나리오

1. 모니터링하려는 프로젝트 폴더를 생성하고 `git init`으로 Git 저장소를 초기화합니다.
2. `Plan.md` 파일을 작성하여 개발 계획과 체크리스트를 정의합니다.
3. Bart Dashboard를 실행한 뒤, 웹 브라우저에서 프로젝트 경로를 등록합니다.
4. Claude Code CLI로 개발을 진행합니다.
5. Dashboard에서 진행률, 커밋 내역, 기술 스택 등을 실시간으로 모니터링합니다.

## 설치 방법

### 사전 요구사항

- **Node.js** 18 이상
- **npm** (Node.js에 포함) 또는 **pnpm**
- **Git** (Git 타임라인 기능 사용 시 필요)

### 설치 단계

1. 저장소를 클론하거나 프로젝트 폴더로 이동합니다.

```bash
cd Bart-dashboard
```

2. 백엔드 의존성을 설치합니다.

```bash
cd backend
npm install
```

3. 프론트엔드 의존성을 설치합니다.

```bash
cd ../frontend
npm install
```

## 실행 방법

백엔드와 프론트엔드를 각각 별도의 터미널에서 실행합니다.

### 백엔드 서버 시작

```bash
cd backend
npm run dev
```

- 포트: **3001** (기본값)
- 환경변수 `PORT`로 변경 가능
- WebSocket 경로: `ws://localhost:3001/ws`

### 프론트엔드 개발 서버 시작

```bash
cd frontend
npm run dev
```

- 포트: **5173** (기본값)
- 브라우저에서 http://localhost:5173 으로 접속

### 프로덕션 빌드

```bash
# 백엔드
cd backend
npm run build
npm start

# 프론트엔드
cd frontend
npm run build
npm run preview
```

## 프로젝트 구조

```
Bart-dashboard/
├── Plan.md                         # 프로젝트 개발 계획 및 진행률 체크리스트
├── .gitignore                      # Git 무시 파일 설정
├── backend/                        # 백엔드 (Express + TypeScript)
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   └── server.ts           # Express 서버, WebSocket 설정, 라우트 마운트
│   │   ├── config/
│   │   │   └── index.ts            # 환경변수 기반 설정 (포트, 데이터 경로 등)
│   │   ├── routes/
│   │   │   └── index.ts            # API 라우트 정의
│   │   ├── controllers/
│   │   │   ├── projectController.ts   # 프로젝트 CRUD 및 요약 정보
│   │   │   ├── planController.ts      # Plan.md 진행률 조회
│   │   │   ├── timelineController.ts  # Git 커밋 타임라인
│   │   │   ├── stackController.ts     # 기술 스택 분석
│   │   │   ├── erdController.ts       # ERD 데이터 조회
│   │   │   └── syncController.ts      # 프로젝트 전체 동기화
│   │   ├── services/
│   │   │   ├── projectService.ts      # 프로젝트 저장/조회 (JSON 파일 기반)
│   │   │   ├── planService.ts         # Plan.md 파일 읽기 및 파싱
│   │   │   ├── gitService.ts          # Git 명령 실행 및 결과 가공
│   │   │   ├── stackService.ts        # 기술 스택 감지 서비스
│   │   │   ├── erdService.ts          # ERD 스키마 파일 탐색 및 파싱
│   │   │   └── watcherService.ts      # Chokidar 기반 파일 변경 감시
│   │   ├── analyzers/
│   │   │   ├── gitAnalyzer.ts         # Git 명령 실행, 로그 파싱, 커밋 분류
│   │   │   └── stackDetector.ts       # package.json/설정파일/확장자 기반 기술 감지
│   │   ├── parsers/
│   │   │   ├── planParser.ts          # Plan.md 체크박스 파싱 및 진행률 계산
│   │   │   └── schemaParser.ts        # Prisma/SQL 스키마 파싱
│   │   ├── adapters/
│   │   │   └── claudeLogAdapter.ts    # Claude CLI 로그 어댑터 (미래 확장용)
│   │   ├── middleware/
│   │   │   ├── asyncHandler.ts        # async Express 핸들러 래퍼
│   │   │   └── errorHandler.ts        # 전역 에러 핸들러 (ApiResponse 형식)
│   │   ├── utils/
│   │   │   ├── logger.ts              # 구조화 로거
│   │   │   └── pathValidator.ts       # 경로 검증 및 디렉토리 트래버설 방지
│   │   └── types/
│   │       └── index.ts               # 백엔드 전용 타입
│   └── data/                          # 런타임 데이터 (projects.json 등)
├── frontend/                       # 프론트엔드 (React + Vite + TypeScript)
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx                   # React 앱 진입점
│   │   ├── app/
│   │   │   └── App.tsx                # 라우터 및 앱 레이아웃
│   │   ├── pages/
│   │   │   ├── ProjectListPage.tsx    # 프로젝트 목록 페이지
│   │   │   └── ProjectDashboardPage.tsx # 프로젝트 상세 대시보드
│   │   ├── components/
│   │   │   ├── common/                # 공통 UI 컴포넌트
│   │   │   │   ├── EmptyState.tsx        # 빈 상태 안내 컴포넌트
│   │   │   │   ├── ErrorBanner.tsx       # 에러 배너
│   │   │   │   ├── LoadingSkeleton.tsx   # 로딩 스켈레톤
│   │   │   │   ├── Modal.tsx             # 모달 다이얼로그
│   │   │   │   ├── StatusBadge.tsx       # 상태 뱃지
│   │   │   │   └── Tooltip.tsx           # 툴팁
│   │   │   ├── dashboard/             # 대시보드 메인 컴포넌트
│   │   │   │   ├── AddProjectModal.tsx   # 프로젝트 추가 모달
│   │   │   │   ├── ProgressCard.tsx      # 진행률 카드
│   │   │   │   └── ProjectHeader.tsx     # 프로젝트 헤더
│   │   │   ├── erd/                   # ERD 관련 컴포넌트
│   │   │   │   ├── ErdViewer.tsx         # ERD 다이어그램 뷰어
│   │   │   │   └── ErdTableDetail.tsx    # 테이블 상세 정보
│   │   │   ├── stack/                 # 기술 스택 컴포넌트
│   │   │   │   └── TechStackCard.tsx     # 기술 스택 카드
│   │   │   └── timeline/              # 타임라인 컴포넌트
│   │   │       ├── TimelineList.tsx      # 커밋 목록
│   │   │       ├── TimelineDetailPanel.tsx # 커밋 상세 패널
│   │   │       └── ChangeFileList.tsx    # 변경 파일 목록
│   │   ├── hooks/
│   │   │   ├── usePolling.ts          # 주기적 데이터 갱신 훅
│   │   │   └── useWebSocket.ts        # WebSocket 연결 관리 훅
│   │   ├── store/
│   │   │   ├── useProjectStore.ts     # 프로젝트 목록 상태 (Zustand)
│   │   │   └── useDashboardStore.ts   # 대시보드 상세 상태 (Zustand)
│   │   ├── services/
│   │   │   └── api.ts                 # Axios 기반 API 호출 함수
│   │   ├── utils/
│   │   │   ├── colors.ts              # 색상 유틸리티
│   │   │   └── format.ts              # 날짜/숫자 포맷 유틸리티
│   │   └── types/
│   │       └── index.ts               # 프론트엔드 전용 타입
├── shared/                         # 프론트/백 공유 모듈
│   ├── types/
│   │   └── index.ts                # 공유 타입 정의 (ApiResponse, Project 등)
│   └── constants/
│       └── index.ts                # 공유 상수 (커밋 타입, 에러 코드, 색상 등)
├── docs/                           # 프로젝트 문서
│   ├── api/                        # API 레퍼런스
│   ├── architecture/               # 아키텍처 문서
│   └── decisions/                  # ADR (Architecture Decision Records)
└── scripts/                        # 유틸리티 스크립트
```

## API 문서

모든 API는 `/api` 접두사를 사용하며, 응답은 `ApiResponse<T>` 형식을 따릅니다.

### 프로젝트 관리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/projects` | 등록된 프로젝트 목록 조회 |
| `POST` | `/api/projects` | 새 프로젝트 등록 (경로 지정) |
| `GET` | `/api/projects/:projectId/summary` | 프로젝트 요약 정보 (진행률, Git 상태, 경고) |
| `DELETE` | `/api/projects/:projectId` | 프로젝트 삭제 |

### 분석 데이터
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/projects/:projectId/plan` | Plan.md 진행률 조회 |
| `GET` | `/api/projects/:projectId/stack` | 기술 스택 분석 결과 |
| `GET` | `/api/projects/:projectId/timeline` | Git 커밋 타임라인 |
| `GET` | `/api/projects/:projectId/timeline/:commitHash` | 특정 커밋 상세 정보 및 diff |
| `GET` | `/api/projects/:projectId/erd` | ERD (스키마 기반) |

### 동기화
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/projects/:projectId/sync` | 전체 데이터 재분석 |

### 기타
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/health` | 헬스 체크 |
| WebSocket | `ws://localhost:3001/ws` | 파일 변경 이벤트 실시간 수신 |

상세 API 레퍼런스는 [docs/api/endpoints.md](docs/api/endpoints.md)를 참조하세요.

## 검증 방법

### 1. 서버 구동 확인

```bash
# 백엔드 헬스 체크
curl http://localhost:3001/health
# 응답 예시: {"status":"ok","timestamp":"2026-03-19T..."}
```

### 2. 프로젝트 등록 및 조회

```bash
# 프로젝트 등록
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"path": "D:\\MyProject", "name": "테스트 프로젝트"}'

# 프로젝트 목록 조회
curl http://localhost:3001/api/projects
```

### 3. 프론트엔드 확인

- http://localhost:5173 에 접속하여 프로젝트 추가 버튼을 클릭합니다.
- 프로젝트 경로를 입력하고 등록합니다.
- 대시보드에서 진행률, 타임라인, 기술 스택 카드가 표시되는지 확인합니다.

### 4. 실시간 업데이트 확인

- 등록된 프로젝트의 `Plan.md`를 수정하고 저장합니다.
- 대시보드에서 진행률이 자동으로 갱신되는지 확인합니다.

## 기술 스택

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Zustand 4, React Router 6, Axios
- **Backend**: Node.js, Express 4, TypeScript 5, Chokidar 3, WebSocket (ws), UUID
- **Shared**: TypeScript 타입 정의 및 상수 (프론트/백 공유)

## 향후 개선 포인트

- [ ] Claude CLI 로그 연동 (현재 No-op 어댑터 구현 완료)
- [ ] 멀티 프로젝트 UI 확장
- [ ] TypeORM entity 파싱 지원
- [ ] GitHub 저장소 자동 동기화
- [ ] 인증/권한 시스템 (AMS 통합)
- [ ] 프로젝트 데이터 영속성 개선 (현재 JSON 파일 기반)
