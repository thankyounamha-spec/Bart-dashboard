# Bart-dashboard 개발 계획

## 프로젝트 개요
Claude Code CLI 기반 개발 프로젝트의 진행 상황을 시각화하는 Vibe Dashboard

## 주요 기능

### 1. 프로젝트 관리
- [x] 프로젝트 등록 API
- [x] 프로젝트 경로 검증
- [x] 프로젝트 목록 조회
- [x] 프로젝트 설정 JSON 파일 저장
- [x] 프로젝트 삭제 기능
- [x] 프로젝트 드래그 앤 드롭 순서 변경
- [x] 프로젝트 전환 드롭다운

### 2. PLAN.md 진행률 추적
- [x] PLAN.md 파일 읽기
- [x] 체크박스 파싱 ([ ], [x])
- [x] 전체 진행률 계산
- [x] 섹션별 진행률 계산
- [x] 실시간 파일 변경 감지
- [x] PLAN.md 자동 생성 (git log 기반)
- [x] PLAN.md 체크박스 편집기 (클릭 토글)

### 3. 기술 스택 분석
- [x] package.json 분석
- [x] 파일 확장자 기반 분석
- [x] 기술명 + 버전 수집
- [x] 감지 근거 저장
- [x] 하위 디렉토리 스캔 (모노레포 대응)

### 4. Git 타임라인
- [x] git log 읽기
- [x] 커밋 타입 분류
- [x] 변경 파일 목록
- [x] 커밋 상세 정보
- [x] diff summary
- [x] 파일별 diff 미리보기
- [x] 커밋 통계 (오늘/이번주/타입별/7일 차트)

### 5. ERD 시각화
- [x] Prisma schema 파싱
- [x] SQL schema 파싱 (한글 테이블명/MySQL 대응)
- [x] 테이블/엔티티 시각화
- [x] 하위 디렉토리 DDL 자동 탐색
- [x] TypeORM entity 파싱
- [x] GitHub repo 동기화

### 6. Dashboard UI
- [x] 프로젝트 헤더
- [x] 진행률 카드
- [x] 기술 스택 카드
- [x] 타임라인 패널
- [x] 상세 정보 패널
- [x] ERD 뷰어
- [x] 상태/오류 표시
- [x] 커밋 통계 카드
- [x] 파일 트리 뷰
- [x] PDF 내보내기
- [x] 다크/라이트 모드 전환
- [x] 프로젝트 비교 뷰

### 7. 실시간 감지
- [x] File watcher (chokidar)
- [x] Polling fallback (30초)
- [x] Debounce 처리
- [x] 브라우저 알림 (새 커밋/진행률 변경)

### 8. 운영 안정성
- [x] 구조화 로거
- [x] API 응답 표준화
- [x] 경로 보안 검증
- [x] EADDRINUSE 포트 충돌 처리
- [x] Graceful degradation (Plan/Git/ERD 없어도 동작)
- [x] Claude 로그 adapter 연동
- [x] 팀 단위 모니터링
