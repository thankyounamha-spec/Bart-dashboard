# ADR-003: Graceful Degradation (우아한 성능 저하) 원칙

## 상태

채택됨 (Accepted)

## 맥락

Bart Dashboard는 프로젝트의 다양한 측면(Plan.md, Git, 기술 스택, ERD)을 분석합니다. 하지만 모든 프로젝트가 이 모든 요소를 갖추고 있지는 않습니다:

- Git이 초기화되지 않은 프로젝트도 있습니다.
- Plan.md 파일이 없을 수 있습니다.
- Prisma나 SQL 스키마 파일이 없는 프로젝트가 대부분입니다.
- package.json이 없는 비-Node.js 프로젝트도 지원해야 합니다.

데이터가 누락될 때 시스템이 어떻게 동작해야 하는지 결정해야 합니다.

## 결정

**모든 분석 기능은 데이터가 없을 때 에러를 발생시키지 않고, `null` 또는 빈 결과를 반환합니다.** 프론트엔드는 `null` 데이터를 받으면 해당 섹션을 숨기거나 안내 메시지를 표시합니다.

## 근거

### 부분 동작이 완전 실패보다 낫다

사용자가 Git 없이 프로젝트를 시작했더라도, Plan.md 진행률 추적은 정상적으로 동작해야 합니다. 하나의 기능이 사용 불가능하다고 해서 전체 대시보드가 동작하지 않는 것은 바람직하지 않습니다.

### 점진적 기능 활성화

프로젝트 개발 초기에는 Plan.md만 있을 수 있고, 이후 `git init`, 스키마 파일 추가 등이 순차적으로 진행됩니다. 대시보드는 프로젝트가 성장하면서 자연스럽게 더 많은 데이터를 보여주어야 합니다.

### 사용자 경험

에러 메시지 대신 안내 메시지를 통해 사용자에게 다음 단계를 제안합니다:
- "Plan.md 파일이 없습니다. 진행률 추적을 위해 Plan.md를 작성해보세요."
- "Git 저장소가 초기화되지 않았습니다."

## 구현 방식

### 백엔드: try/catch와 null 반환

각 서비스 계층에서 데이터 부재 시 예외를 발생시키지 않고 `null`을 반환합니다.

**Plan 서비스:**
```typescript
// planService.ts
export async function getPlanProgress(projectPath: string): Promise<PlanSummary | null> {
  try {
    // Plan.md 파일을 찾아 파싱
    const planPath = await findPlanFile(projectPath);
    if (!planPath) return null;  // 파일 없으면 null 반환
    return await parsePlanFile(planPath);
  } catch {
    return null;  // 파싱 실패도 null 반환
  }
}
```

**Git 분석기:**
```typescript
// gitAnalyzer.ts
export async function isGitRepo(projectPath: string): Promise<boolean> {
  try {
    await fs.access(path.join(projectPath, '.git'));
    return true;
  } catch {
    return false;  // .git 없으면 false 반환 (에러 아님)
  }
}

export async function getLastCommit(projectPath: string): Promise<GitCommitSummary | null> {
  try {
    const isRepo = await isGitRepo(projectPath);
    if (!isRepo) return null;
    // ...
  } catch {
    return null;  // 커밋이 없어도 null 반환
  }
}
```

**기술 스택 감지기:**
```typescript
// stackDetector.ts - 각 단계가 독립적으로 실패 허용
try {
  // package.json 분석
} catch {
  // package.json이 없는 프로젝트도 정상
  logger.debug('package.json 없음 - Node.js 프로젝트가 아닐 수 있음');
}
```

### 백엔드: 경고 시스템 (DashboardWarning)

`ProjectSummary` 응답에 `warnings` 배열을 포함하여, 누락된 데이터에 대한 안내를 제공합니다.

```typescript
const warnings: DashboardWarning[] = [];

if (!plan) {
  warnings.push({
    type: 'info',
    code: ERROR_CODES.PLAN_NOT_FOUND,
    message: 'Plan.md 파일이 없습니다. 진행률 추적을 위해 Plan.md를 작성해보세요.',
  });
}

if (!gitStatus.isGitRepo) {
  warnings.push({
    type: 'warning',
    code: ERROR_CODES.GIT_NOT_INITIALIZED,
    message: 'Git 저장소가 초기화되지 않았습니다.',
  });
}
```

경고 유형:
- `info`: 정보성 안내 (기능 사용을 위한 가이드)
- `warning`: 일부 기능 제한 안내
- `error`: 심각한 문제 알림

### 프론트엔드: 조건부 렌더링

```tsx
// ProgressCard - plan이 null이면 EmptyState 표시
{plan ? <ProgressBar percent={plan.progressPercent} /> : <EmptyState message="Plan.md를 작성해보세요" />}

// ErdViewer - ERD 데이터가 없으면 안내 메시지
{erd ? <ErdDiagram tables={erd.tables} /> : <EmptyState message="스키마 파일이 없습니다" />}
```

### 동기화 엔드포인트에서의 적용

`/api/projects/:id/sync` 엔드포인트는 모든 분석을 병렬로 수행하며, 개별 분석의 실패가 전체 동기화를 실패시키지 않습니다:

```typescript
const [plan, gitStatus, lastCommit, stack, erd] = await Promise.all([
  planService.getPlanProgress(project.path),    // null 가능
  gitService.getStatus(project.path),           // isGitRepo: false 가능
  gitService.getLastCommit(project.path),       // null 가능
  stackService.getStack(project.path),          // 빈 배열 가능
  erdService.getErd(project.path),              // null 가능
]);
```

## 결과

### 장점

- 프로젝트의 완성도와 관계없이 대시보드를 사용할 수 있습니다.
- 사용자에게 친절한 안내 메시지를 제공하여 다음 단계를 알려줍니다.
- 하나의 분석 실패가 다른 분석에 영향을 주지 않습니다.
- 새 프로젝트(빈 디렉토리)에서도 즉시 사용 시작이 가능합니다.

### 단점

- 프론트엔드에서 모든 데이터가 `null`일 수 있다는 가정 하에 코딩해야 합니다.
- 실제 에러(파일 권한 문제 등)와 정상적인 부재를 구분하기 어려울 수 있습니다.
  - 완화 방안: 로거에 debug 수준으로 상세 정보를 기록합니다.

## 관련 파일

- `shared/types/index.ts` - `DashboardWarning` 인터페이스
- `shared/constants/index.ts` - `ERROR_CODES` 상수
- `backend/src/controllers/projectController.ts` - `getProjectSummary`에서 warnings 생성
- `backend/src/controllers/syncController.ts` - 병렬 분석과 null 허용
- `frontend/src/components/common/EmptyState.tsx` - 빈 상태 UI 컴포넌트
- `frontend/src/components/common/ErrorBanner.tsx` - 에러/경고 배너
