# Bart-dashboard 개발 계획

## 프로젝트 개요
Claude Code CLI 기반 개발 프로젝트의 진행 상황을 시각화하는 Vibe Dashboard

## 주요 기능

### 1. 프로젝트 관리
- [x] 프로젝트 등록 API
- [x] 프로젝트 경로 검증
- [x] 프로젝트 목록 조회
- [x] 프로젝트 설정 JSON 파일 저장

### 2. Plan.md 진행률 추적
- [x] Plan.md 파일 읽기
- [x] 체크박스 파싱 ([ ], [x])
- [x] 전체 진행률 계산
- [x] 섹션별 진행률 계산
- [x] 실시간 파일 변경 감지

### 3. 기술 스택 분석
- [x] package.json 분석
- [x] 파일 확장자 기반 분석
- [x] 기술명 + 버전 수집
- [x] 감지 근거 저장

### 4. Git 타임라인
- [x] git log 읽기
- [x] 커밋 타입 분류
- [x] 변경 파일 목록
- [x] 커밋 상세 정보
- [x] diff summary

### 5. ERD 시각화
- [x] Prisma schema 파싱
- [x] SQL schema 파싱
- [x] 테이블/엔티티 시각화
- [ ] TypeORM entity 파싱
- [ ] GitHub repo 동기화

### 6. Dashboard UI
- [x] 프로젝트 헤더
- [x] 진행률 카드
- [x] 기술 스택 카드
- [x] 타임라인 패널
- [x] 상세 정보 패널
- [x] ERD 뷰어
- [x] 상태/오류 표시

### 7. 실시간 감지
- [x] File watcher (chokidar)
- [x] Polling fallback
- [x] Debounce 처리

### 8. 운영 안정성
- [x] 구조화 로거
- [x] API 응답 표준화
- [x] 경로 보안 검증
- [ ] Claude 로그 adapter placeholder
- [ ] 멀티 프로젝트 UI 확장
