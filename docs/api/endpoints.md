# API 레퍼런스

## 개요

- **기본 URL**: `http://localhost:3001`
- **API 접두사**: `/api`
- **WebSocket**: `ws://localhost:3001/ws`
- **Content-Type**: `application/json`
- **타임아웃**: 프론트엔드 기본 15초

## 표준 응답 형식

모든 API는 `ApiResponse<T>` 형식으로 응답합니다.

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

interface ApiError {
  code: string;
  message: string;
}
```

### 에러 코드 목록

| 코드 | 설명 |
|------|------|
| `PROJECT_NOT_FOUND` | 요청한 프로젝트 ID가 존재하지 않음 |
| `PLAN_NOT_FOUND` | Plan.md 파일이 프로젝트에 존재하지 않음 |
| `GIT_NOT_INITIALIZED` | Git 저장소가 초기화되지 않음 |
| `SCHEMA_NOT_FOUND` | 스키마 파일(prisma/sql)을 찾을 수 없음 |
| `INVALID_PATH` | 유효하지 않은 프로젝트 경로 |
| `PATH_NOT_EXISTS` | 경로가 파일 시스템에 존재하지 않음 |
| `PARSE_ERROR` | 파일 파싱 중 오류 발생 |
| `INTERNAL_ERROR` | 서버 내부 오류 |

---

## 헬스 체크

### `GET /health`

서버 동작 상태를 확인합니다.

**응답 예시:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-19T09:00:00.000Z"
}
```

---

## 프로젝트 관리

### `GET /api/projects`

등록된 모든 프로젝트 목록을 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "my-project",
      "path": "D:\\Projects\\my-project",
      "createdAt": "2026-03-19T08:00:00.000Z",
      "lastSyncedAt": "2026-03-19T09:00:00.000Z"
    }
  ],
  "error": null
}
```

---

### `POST /api/projects`

새 프로젝트를 등록합니다.

**요청 본문:**
```json
{
  "path": "D:\\Projects\\my-project",
  "name": "나의 프로젝트"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `path` | string | 필수 | 프로젝트 절대 경로 |
| `name` | string | 선택 | 프로젝트 표시 이름 (미입력 시 디렉토리명 사용) |

**성공 응답 (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "나의 프로젝트",
    "path": "D:\\Projects\\my-project",
    "createdAt": "2026-03-19T08:00:00.000Z",
    "lastSyncedAt": null
  },
  "error": null
}
```

**에러 응답 (400) - 잘못된 경로:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_PATH",
    "message": "프로젝트 경로를 입력해주세요."
  }
}
```

**에러 응답 (409) - 중복 등록:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DUPLICATE_PROJECT",
    "message": "이미 등록된 프로젝트 경로입니다."
  }
}
```

---

### `GET /api/projects/:projectId/summary`

프로젝트의 요약 정보를 조회합니다. 대시보드 메인 카드에 표시되는 데이터입니다.

내부적으로 Plan 파싱, Git 상태 조회, 최근 커밋 조회를 병렬로 수행합니다.

**경로 매개변수:**
| 매개변수 | 설명 |
|----------|------|
| `projectId` | 프로젝트 UUID |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "my-project",
      "path": "D:\\Projects\\my-project",
      "createdAt": "2026-03-19T08:00:00.000Z",
      "lastSyncedAt": null
    },
    "plan": {
      "totalTasks": 30,
      "completedTasks": 25,
      "progressPercent": 83,
      "sections": [
        {
          "title": "프로젝트 관리",
          "totalTasks": 4,
          "completedTasks": 4,
          "progressPercent": 100,
          "tasks": [
            { "text": "프로젝트 등록 API", "completed": true },
            { "text": "프로젝트 경로 검증", "completed": true }
          ]
        }
      ]
    },
    "gitStatus": {
      "isGitRepo": true,
      "currentBranch": "main",
      "totalCommits": 42
    },
    "lastCommit": {
      "hash": "abc1234567890abcdef1234567890abcdef123456",
      "subject": "feat: ERD 뷰어 구현",
      "date": "2026-03-19T08:30:00.000Z",
      "author": "developer"
    },
    "warnings": []
  },
  "error": null
}
```

**Plan.md가 없는 경우, warnings 필드에 안내 포함:**
```json
"warnings": [
  {
    "type": "info",
    "code": "PLAN_NOT_FOUND",
    "message": "Plan.md 파일이 없습니다. 진행률 추적을 위해 Plan.md를 작성해보세요."
  }
]
```

---

### `DELETE /api/projects/:projectId`

프로젝트를 삭제합니다. 파일 시스템의 프로젝트 파일은 삭제되지 않으며, 대시보드 등록 정보만 제거됩니다.

**응답 예시:**
```json
{
  "success": true,
  "data": { "deleted": true },
  "error": null
}
```

---

## Plan.md 진행률

### `GET /api/projects/:projectId/plan`

Plan.md 파일을 파싱하여 체크박스 기반 진행률을 반환합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "totalTasks": 30,
    "completedTasks": 25,
    "progressPercent": 83,
    "sections": [
      {
        "title": "프로젝트 관리",
        "totalTasks": 4,
        "completedTasks": 4,
        "progressPercent": 100,
        "tasks": [
          { "text": "프로젝트 등록 API", "completed": true },
          { "text": "프로젝트 경로 검증", "completed": true },
          { "text": "프로젝트 목록 조회", "completed": true },
          { "text": "프로젝트 설정 JSON 파일 저장", "completed": true }
        ]
      },
      {
        "title": "Plan.md 진행률 추적",
        "totalTasks": 5,
        "completedTasks": 5,
        "progressPercent": 100,
        "tasks": [
          { "text": "Plan.md 파일 읽기", "completed": true },
          { "text": "체크박스 파싱 ([ ], [x])", "completed": true },
          { "text": "전체 진행률 계산", "completed": true },
          { "text": "섹션별 진행률 계산", "completed": true },
          { "text": "실시간 파일 변경 감지", "completed": true }
        ]
      }
    ]
  },
  "error": null
}
```

**Plan.md가 없는 경우 (404):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan.md 파일을 찾을 수 없습니다."
  }
}
```

---

## 기술 스택

### `GET /api/projects/:projectId/stack`

프로젝트의 기술 스택을 분석합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "stacks": [
      {
        "name": "Node.js",
        "version": null,
        "category": "runtime",
        "source": "packageJson",
        "sourceFile": "package.json"
      },
      {
        "name": "React",
        "version": "18.2.0",
        "category": "framework",
        "source": "packageJson",
        "sourceFile": "package.json"
      },
      {
        "name": "TypeScript",
        "version": "5.3.3",
        "category": "language",
        "source": "packageJson",
        "sourceFile": "package.json"
      },
      {
        "name": "Tailwind CSS",
        "version": null,
        "category": "framework",
        "source": "configFile",
        "sourceFile": "tailwind.config.ts"
      }
    ],
    "analyzedAt": "2026-03-19T09:00:00.000Z"
  },
  "error": null
}
```

**카테고리 종류:** `language`, `framework`, `library`, `database`, `tool`, `runtime`, `other`

**감지 출처:** `packageJson`, `lockFile`, `configFile`, `fileExtension`, `dockerfile`, `inferred`

---

## Git 타임라인

### `GET /api/projects/:projectId/timeline`

Git 커밋 이력을 조회합니다. 기본 최대 50개 커밋을 반환합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "hash": "abc1234567890abcdef1234567890abcdef123456",
      "hashShort": "abc1234",
      "subject": "feat: ERD 뷰어 구현",
      "body": "Prisma 스키마와 SQL 파일을 파싱하여 테이블 관계를 시각화",
      "date": "2026-03-19T08:30:00+09:00",
      "author": "developer",
      "type": "feat",
      "files": [
        { "path": "frontend/src/components/erd/ErdViewer.tsx", "status": "added" },
        { "path": "backend/src/parsers/schemaParser.ts", "status": "added" },
        { "path": "backend/src/services/erdService.ts", "status": "modified" }
      ]
    }
  ],
  "error": null
}
```

**커밋 타입 분류:**

| 타입 | 라벨 | 설명 |
|------|------|------|
| `feat` | 기능 | 새 기능 추가 |
| `fix` | 수정 | 버그 수정 |
| `refactor` | 리팩토링 | 코드 구조 개선 |
| `docs` | 문서 | 문서 변경 |
| `style` | 스타일 | 코드 포맷팅 변경 |
| `chore` | 기타 | 빌드, CI, 설정 변경 |
| `test` | 테스트 | 테스트 추가/수정 |
| `perf` | 성능 | 성능 개선 |
| `other` | 기타 | 분류 불가 |

---

### `GET /api/projects/:projectId/timeline/:commitHash`

특정 커밋의 상세 정보와 diff 요약을 조회합니다.

**경로 매개변수:**
| 매개변수 | 설명 |
|----------|------|
| `commitHash` | Git 커밋 해시 (4~40자 hex) |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "hash": "abc1234567890abcdef1234567890abcdef123456",
    "hashShort": "abc1234",
    "subject": "feat: ERD 뷰어 구현",
    "body": "",
    "date": "2026-03-19T08:30:00+09:00",
    "author": "developer",
    "type": "feat",
    "files": [
      {
        "path": "frontend/src/components/erd/ErdViewer.tsx",
        "status": "added",
        "additions": 150,
        "deletions": 0
      },
      {
        "path": "backend/src/services/erdService.ts",
        "status": "modified",
        "additions": 30,
        "deletions": 5
      }
    ],
    "diffSummary": {
      "totalFiles": 2,
      "totalAdditions": 180,
      "totalDeletions": 5,
      "files": [
        { "path": "frontend/src/components/erd/ErdViewer.tsx", "status": "modified", "additions": 150, "deletions": 0 },
        { "path": "backend/src/services/erdService.ts", "status": "modified", "additions": 30, "deletions": 5 }
      ]
    }
  },
  "error": null
}
```

---

## ERD

### `GET /api/projects/:projectId/erd`

프로젝트의 스키마 파일(Prisma 또는 SQL)을 파싱하여 ERD 데이터를 반환합니다.

**감지 우선순위:**
1. `prisma/schema.prisma`
2. 프로젝트 루트의 `*.sql` 파일

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "User",
        "columns": [
          { "name": "id", "type": "Int", "isPrimaryKey": true, "isForeignKey": false, "isNullable": false, "defaultValue": "autoincrement()" },
          { "name": "email", "type": "String", "isPrimaryKey": false, "isForeignKey": false, "isNullable": false },
          { "name": "name", "type": "String?", "isPrimaryKey": false, "isForeignKey": false, "isNullable": true }
        ]
      },
      {
        "name": "Post",
        "columns": [
          { "name": "id", "type": "Int", "isPrimaryKey": true, "isForeignKey": false, "isNullable": false, "defaultValue": "autoincrement()" },
          { "name": "title", "type": "String", "isPrimaryKey": false, "isForeignKey": false, "isNullable": false },
          { "name": "authorId", "type": "Int", "isPrimaryKey": false, "isForeignKey": true, "isNullable": false, "relationTo": "User" }
        ]
      }
    ],
    "relations": [
      {
        "from": "Post",
        "to": "User",
        "fromColumn": "author",
        "toColumn": "id",
        "type": "one-to-many"
      }
    ],
    "source": "prisma",
    "sourceFile": "prisma/schema.prisma"
  },
  "error": null
}
```

**스키마 파일이 없는 경우 (404):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "SCHEMA_NOT_FOUND",
    "message": "스키마 파일을 찾을 수 없습니다. (prisma/schema.prisma 또는 *.sql)"
  }
}
```

---

## 동기화

### `POST /api/projects/:projectId/sync`

프로젝트의 모든 데이터를 재분석합니다. Plan, Git, 기술 스택, ERD를 병렬로 분석하고, `lastSyncedAt`을 갱신합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "my-project",
      "path": "D:\\Projects\\my-project",
      "createdAt": "2026-03-19T08:00:00.000Z",
      "lastSyncedAt": "2026-03-19T09:15:00.000Z"
    },
    "plan": { "totalTasks": 30, "completedTasks": 25, "progressPercent": 83, "sections": [] },
    "gitStatus": { "isGitRepo": true, "currentBranch": "main", "totalCommits": 42 },
    "lastCommit": { "hash": "abc123...", "subject": "feat: sync", "date": "...", "author": "dev" },
    "warnings": [],
    "stack": { "stacks": [], "analyzedAt": "2026-03-19T09:15:00.000Z" },
    "erd": null
  },
  "error": null
}
```

---

## WebSocket 이벤트

### 연결

```
ws://localhost:3001/ws
```

### 수신 이벤트: `FileChangeEvent`

파일 변경이 감지되면 서버에서 모든 WebSocket 클라이언트에 브로드캐스트합니다.

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "changeType": "plan",
  "timestamp": "2026-03-19T09:00:00.000Z"
}
```

**changeType 종류:**

| 값 | 설명 | 감시 파일 |
|----|------|-----------|
| `plan` | Plan.md 변경 | `Plan.md`, `plan.md`, `PLAN.md` |
| `git` | Git 상태 변경 | `.git/HEAD`, `.git/refs/**` |
| `config` | 설정 파일 변경 | `package.json`, `tsconfig.json` 등 |
| `schema` | 스키마 파일 변경 | `prisma/schema.prisma`, `*.sql` |
