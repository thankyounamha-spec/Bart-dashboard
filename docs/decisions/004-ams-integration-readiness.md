# ADR-004: AMS 통합 준비 설계

## 상태

제안됨 (Proposed) - 현재 구현은 준비 단계

## 맥락

Bart Dashboard는 현재 로컬 개발 도구로 동작하지만, 향후 AMS(Account Management System)와 통합하여 다음 기능을 지원할 계획입니다:

- 사용자 인증 및 권한 관리
- 팀 단위 프로젝트 공유
- 원격 서버에서의 대시보드 접근
- Claude CLI 사용 내역 추적

이러한 확장을 위해 현재 아키텍처에서 미리 준비해두어야 할 사항을 결정합니다.

## 결정

**현재 기능에는 인증을 추가하지 않되, 향후 AMS 통합이 용이하도록 아키텍처를 설계**합니다. 구체적으로 다음 패턴을 적용합니다:

1. **표준 API 응답 형식** 유지
2. **인터페이스 기반 어댑터 패턴** 적용
3. **미들웨어 체인에 인증 계층 삽입 가능한 구조** 유지
4. **프로젝트 ID 기반 리소스 접근** 패턴 유지

## 근거

### 1. 표준 API 응답 형식 (`ApiResponse<T>`)

모든 API가 동일한 응답 형식을 따르므로, AMS 통합 시 인증 에러도 같은 형식으로 반환할 수 있습니다.

```typescript
// 현재 에러 응답 형식
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

// AMS 통합 시 추가될 에러 코드 예시
const ERROR_CODES = {
  // ... 기존 코드 ...
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
};
```

### 2. Claude CLI 로그 어댑터 패턴

`claudeLogAdapter.ts`에서 인터페이스 기반 어댑터 패턴을 사용합니다. 현재는 No-op 구현이지만, 실제 구현으로 교체하기 쉬운 구조입니다.

```typescript
// 인터페이스 정의 (backend/src/types/index.ts)
interface ClaudeLogAdapter {
  getRecentLogs(projectPath: string, limit?: number): Promise<ClaudeLogEntry[]>;
  isAvailable(): Promise<boolean>;
}

// 현재: No-op 구현
class NoopClaudeLogAdapter implements ClaudeLogAdapter {
  async getRecentLogs(): Promise<ClaudeLogEntry[]> {
    return [];  // 빈 결과 반환
  }
  async isAvailable(): Promise<boolean> {
    return false;
  }
}

// 향후: 실제 구현으로 교체
class RealClaudeLogAdapter implements ClaudeLogAdapter {
  async getRecentLogs(projectPath: string, limit?: number): Promise<ClaudeLogEntry[]> {
    // Claude CLI 로그 파일 파싱
    // AMS 토큰으로 인증된 세션 로그만 필터링
  }
  async isAvailable(): Promise<boolean> {
    // Claude CLI 설치 여부 확인
  }
}
```

### 3. 미들웨어 체인 구조

Express 미들웨어 체인에서 인증 미들웨어를 삽입할 위치가 명확합니다.

```typescript
// 현재 구조 (server.ts)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
// ↓ 여기에 인증 미들웨어 삽입 가능
// app.use(authMiddleware);
app.use('/api', routes);
app.use(errorHandler);
```

`asyncHandler` 래퍼가 이미 있으므로, 인증 검증 로직도 같은 패턴으로 추가할 수 있습니다.

### 4. 프로젝트 ID 기반 리소스 접근

모든 API가 `:projectId`를 경로 매개변수로 사용하여 리소스에 접근합니다. AMS 통합 시 "이 사용자가 이 프로젝트에 접근 권한이 있는가?"를 검증하는 미들웨어를 추가하기 쉽습니다.

```typescript
// 현재: 프로젝트 ID로 직접 접근
router.get('/projects/:projectId/summary', asyncHandler(projectController.getProjectSummary));

// 향후: 권한 검증 미들웨어 추가
router.get('/projects/:projectId/summary',
  authMiddleware,                              // 인증 확인
  projectAccessMiddleware,                     // 프로젝트 접근 권한 확인
  asyncHandler(projectController.getProjectSummary)
);
```

## 향후 AMS 통합 시 필요한 변경사항

### 1단계: 인증 계층 추가

```
변경 필요 파일:
├── backend/src/middleware/authMiddleware.ts    (신규)
├── backend/src/middleware/projectAccess.ts     (신규)
├── backend/src/services/authService.ts        (신규)
├── backend/src/app/server.ts                  (미들웨어 등록)
└── shared/constants/index.ts                  (인증 에러 코드 추가)
```

### 2단계: 프로젝트 소유권/공유 모델

```
변경 필요 파일:
├── shared/types/index.ts                      (User, Permission 타입 추가)
├── backend/src/services/projectService.ts     (소유자 정보 추가)
└── frontend/src/services/api.ts               (인증 헤더 추가)
```

### 3단계: Claude CLI 로그 통합

```
변경 필요 파일:
├── backend/src/adapters/claudeLogAdapter.ts   (실제 구현으로 교체)
├── backend/src/controllers/claudeController.ts (신규)
├── backend/src/routes/index.ts                (로그 조회 라우트 추가)
└── frontend/src/components/claude/            (로그 뷰어 컴포넌트)
```

## 현재 CORS 설정에 대한 참고사항

현재 CORS가 `origin: true`로 모든 origin을 허용합니다. 이는 로컬 개발 환경에서는 문제없지만, AMS 통합으로 원격 접근을 허용할 때는 반드시 허용 도메인을 제한해야 합니다.

```typescript
// 현재 (로컬 전용)
app.use(cors({ origin: true, credentials: true }));

// AMS 통합 시
app.use(cors({
  origin: ['https://dashboard.example.com'],
  credentials: true,
}));
```

## 결과

### 장점

- 현재 코드에 불필요한 복잡성을 추가하지 않으면서도 확장 경로를 확보합니다.
- 인터페이스 기반 설계로 구현 교체가 용이합니다.
- 미들웨어 체인 구조로 인증 계층을 비침습적으로 추가할 수 있습니다.
- 표준 API 응답 형식으로 인증 에러도 일관되게 처리할 수 있습니다.

### 단점

- 실제 AMS 통합 전까지는 준비 코드(NoopClaudeLogAdapter)가 존재합니다.
- AMS의 구체적인 요구사항이 확정되지 않아, 준비 설계가 실제 요구와 다를 수 있습니다.
- CORS 설정이 현재는 보안적으로 느슨합니다 (로컬 전용이므로 수용 가능).

## 관련 파일

- `backend/src/adapters/claudeLogAdapter.ts` - No-op 어댑터 구현
- `backend/src/app/server.ts` - 미들웨어 체인 구조, CORS 설정
- `backend/src/middleware/asyncHandler.ts` - 비동기 핸들러 래퍼 패턴
- `backend/src/middleware/errorHandler.ts` - 전역 에러 핸들러 (ApiResponse 형식)
- `shared/types/index.ts` - ApiResponse, ApiError 인터페이스
- `shared/constants/index.ts` - ERROR_CODES 상수
