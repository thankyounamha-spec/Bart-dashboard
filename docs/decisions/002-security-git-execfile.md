# ADR-002: Git 명령 실행 시 execFile 사용

## 상태

채택됨 (Accepted)

## 맥락

Bart Dashboard의 백엔드는 프로젝트의 Git 이력을 분석하기 위해 `git log`, `git show`, `git diff` 등의 Git 명령을 실행해야 합니다. Node.js에서 외부 프로세스를 실행하는 방법은 여러 가지가 있습니다:

1. **`child_process.exec`**: 명령을 문자열로 받아 shell을 통해 실행
2. **`child_process.execFile`**: 실행 파일과 인자를 분리하여 직접 실행 (shell 미사용)
3. **`child_process.spawn`**: 스트림 기반 실행 (대용량 출력에 적합)

## 결정

**모든 Git 명령 실행에 `child_process.execFile`을 사용**합니다.

```typescript
// gitAnalyzer.ts
import { execFile } from 'node:child_process';
const execFileAsync = promisify(execFile);

async function git(projectPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: normalizedPath,
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  });
  return stdout;
}
```

## 근거

### Shell Injection 방지

`exec`를 사용하면 명령이 shell을 통해 실행됩니다. 이 경우 커밋 메시지나 파일명에 포함된 특수 문자가 shell 명령으로 해석될 위험이 있습니다.

```typescript
// 위험한 방식 (사용하지 않음)
exec(`git log --format="%s" ${commitHash}`);
// commitHash가 "; rm -rf /" 같은 값이면 시스템 명령이 실행됨
```

`execFile`은 shell을 거치지 않고 Git 바이너리를 직접 실행하며, 인자를 배열로 전달합니다. 따라서 인자 값에 어떤 특수 문자가 포함되어도 shell 명령으로 해석되지 않습니다.

```typescript
// 안전한 방식 (채택)
execFile('git', ['log', '--format=%s', commitHash]);
// commitHash 값이 그대로 git 명령의 인자로 전달됨
```

### 추가 방어 계층: 해시 검증

`execFile`을 사용하더라도, 커밋 해시를 인자로 받는 함수에서는 정규식으로 형식을 추가 검증합니다:

```typescript
if (!/^[a-fA-F0-9]{4,40}$/.test(hash)) {
  throw new Error('유효하지 않은 커밋 해시입니다.');
}
```

이는 "방어 심층(defense in depth)" 원칙에 따른 것으로, `execFile`만으로도 안전하지만 추가적인 입력 검증을 통해 보안을 강화합니다.

### Git 로그 파싱 안전성

`git log` 출력을 파싱할 때 NUL(`\x00`)과 SOH(`\x01`) 문자를 구분자로 사용합니다. 이 제어 문자들은 커밋 메시지에 포함될 가능성이 극히 낮아, 파싱 오류를 최소화합니다.

```typescript
const SEP = '\x00';      // 필드 구분자
const RECORD_SEP = '\x01'; // 레코드 구분자
const format = [`%H`, `%h`, `%s`, `%b`, `%aI`, `%an`].join(SEP);
```

## 결과

### 장점

- 사용자 입력(커밋 해시)이 shell injection으로 이어질 가능성을 원천 차단합니다.
- 커밋 메시지에 shell 특수 문자(`$`, `` ` ``, `|`, `;` 등)가 포함되어도 안전합니다.
- Windows에서 `windowsHide: true` 옵션으로 콘솔 창이 노출되지 않습니다.

### 단점

- 파이프(`|`)나 리다이렉션(`>`) 같은 shell 기능을 사용할 수 없습니다.
  - 필요한 경우 Node.js 코드에서 직접 처리합니다.
- 일부 환경에서 `git` 바이너리의 전체 경로를 지정해야 할 수 있습니다.
  - 현재는 PATH에 git이 포함되어 있다고 가정합니다.

### maxBuffer 설정

`maxBuffer`를 10MB로 설정하여 대규모 diff 출력을 수용하면서도 메모리 고갈을 방지합니다. 기본값(1MB)은 커밋 이력이 많은 프로젝트에서 부족할 수 있습니다.

## 관련 파일

- `backend/src/analyzers/gitAnalyzer.ts` - `git()` 래퍼 함수, `getGitLog()`, `getCommitDetail()`, `getDiffSummary()`
