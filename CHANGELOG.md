# 변경 이력

## [1.0.0] - 2025-11-18

### 추가됨
- ✨ 실시간 혼란도 추적 시스템 구현
- ✨ 5단계 색상 기반 시각화 (초록→노랑→빨강)
- ✨ React 프론트엔드 with TypeScript
- ✨ Node.js/Express 백엔드 API
- ✨ WebSocket 실시간 업데이트
- ✨ LMS 연동 기능 (Canvas, Moodle 등)
- ✨ 행동 메트릭 기반 혼란도 계산 알고리즘
- ✨ 시각화 컴포넌트:
  - ConfusionIndicator (원형/바 형태)
  - ConfusionHeatMap (개념별 히트맵)
  - ConfusionChart (시계열 차트)
- ✨ React Hooks:
  - useConfusionTracking
  - useBehaviorTracking
  - useLMSIntegration
  - useLTILaunch
- ✨ 학생 대시보드 페이지
- ✨ 개입 필요 알림 시스템
- ✨ 포괄적인 API 문서
- ✨ 배포 가이드

### 기술 스택
- **프론트엔드**: React 18, TypeScript, Vite, TailwindCSS, Recharts
- **백엔드**: Node.js, Express, TypeScript, WebSocket
- **상태 관리**: Zustand
- **HTTP 클라이언트**: Axios
- **차트**: Recharts

### 혼란도 계산 메트릭
- 소요 시간 (25%)
- 시도 횟수 (20%)
- 정답 여부 (20%)
- 망설임 시간 (15%)
- 도움 요청 (10%)
- 마우스 움직임 (5%)
- 입력 변경 횟수 (5%)

### API 엔드포인트
- `POST /api/confusion/metrics` - 행동 데이터 제출
- `GET /api/confusion/student/:studentId` - 학생 혼란도 조회
- `GET /api/confusion/concept/:conceptId` - 개념별 혼란도 조회
- `GET /api/confusion/classroom/:classId` - 교실 전체 분석
- `GET /api/confusion/history/:studentId` - 혼란도 이력
- `POST /api/lms/initialize` - LMS 세션 초기화
- `POST /api/lms/sync` - 학생 데이터 동기화
- `POST /api/lms/progress` - 진도 전송
- `GET /api/lms/course/:courseId` - 코스 구조 조회
- `WS /ws/confusion/:studentId` - 실시간 업데이트

### 문서
- README.md - 프로젝트 개요 및 빠른 시작
- docs/API.md - API 상세 문서
- docs/DEPLOYMENT.md - 배포 가이드
- CHANGELOG.md - 변경 이력

## [향후 계획]

### v1.1.0 (예정)
- [ ] PostgreSQL 데이터베이스 연동
- [ ] 교사 대시보드 추가
- [ ] 인증 시스템 (JWT)
- [ ] 단위 테스트 및 통합 테스트
- [ ] CI/CD 파이프라인

### v1.2.0 (예정)
- [ ] 머신러닝 기반 혼란도 예측
- [ ] 개인화된 학습 추천
- [ ] 상세 리포트 생성
- [ ] 이메일 알림

### v2.0.0 (예정)
- [ ] 모바일 앱 (React Native)
- [ ] 다국어 지원
- [ ] 고급 분석 대시보드
- [ ] A/B 테스트 프레임워크
- [ ] 플러그인 시스템
