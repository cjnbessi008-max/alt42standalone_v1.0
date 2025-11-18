# Changelog

모든 주요 변경사항은 이 파일에 문서화됩니다.

## [1.0.0] - 2025-11-18

### 추가됨

#### 백엔드 (FastAPI)
- ✅ 워밍업 문제 추천 API 엔드포인트 구현
  - `POST /api/warmup/recommend`: 동일 유형의 쉬운 문제 추천
  - `POST /api/warmup/submit`: 답안 제출 및 자동 채점
  - `GET /api/warmup/student/{student_id}/history`: 학생 풀이 이력
  - `GET /api/warmup/problems`: 문제 목록 조회
  - `GET /api/warmup/problems/{problem_id}`: 문제 상세 조회

- ✅ 지능형 추천 엔진 (WarmupRecommender)
  - 동일 유형 필터링
  - 난이도 자동 조정 (쉬운 문제 우선)
  - 학생 이력 고려
  - 신뢰도 점수 계산

- ✅ LMS 연동 서비스
  - Moodle LMS 지원
  - Canvas LMS 지원
  - 학생 정보 조회
  - 진도 동기화
  - 성적 제출

- ✅ 데이터 모델 및 샘플 데이터
  - Problem 모델 (문제)
  - StudentAttempt 모델 (풀이 기록)
  - 10개의 샘플 워밍업 문제
    - 분수 덧셈 (3문제)
    - 곱셈 구구단 (2문제)
    - 나눗셈 (2문제)
    - 객관식 (2문제)
    - 참/거짓 (1문제)

#### 프론트엔드 (React + TypeScript)
- ✅ 워밍업 문제 추천 UI 컴포넌트
  - 자동 문제 추천
  - 실시간 답안 입력
  - 즉시 채점 및 피드백
  - 정답/오답 시각적 표시
  - 해설 제공
  - 다음 문제 요청

- ✅ TypeScript 타입 정의
  - Problem, WarmupRecommendationRequest, WarmupRecommendationResponse
  - 한글 레이블 매핑

- ✅ API 클라이언트 서비스
  - Axios 기반 HTTP 클라이언트
  - 타입 안전 API 호출

- ✅ 반응형 디자인
  - 모바일 지원
  - 깔끔한 UI/UX
  - 애니메이션 효과

#### 개발 도구 및 문서
- ✅ Docker 지원
  - docker-compose.yml
  - Dockerfile (backend, frontend)

- ✅ 빠른 시작 스크립트
  - start.sh: 원클릭 실행

- ✅ 포괄적인 문서
  - README.md: 프로젝트 개요 및 설치 가이드
  - USAGE_GUIDE.md: 상세 사용 가이드
  - CHANGELOG.md: 변경 이력
  - API 문서: FastAPI Swagger UI

### 기술 스택

#### 백엔드
- FastAPI 0.104.1
- Pydantic 2.5.0
- Python 3.11+
- aiohttp (비동기 HTTP)

#### 프론트엔드
- React 18.2.0
- TypeScript 4.9.5
- Axios 1.6.2

#### 인프라
- Docker & Docker Compose
- uvicorn (ASGI 서버)

### 주요 특징

1. **즉시 추천**: 학생이 웹앱을 열면 바로 워밍업 문제 추천
2. **LMS 통합**: Moodle, Canvas와 원활한 연동
3. **자동 채점**: 답안 제출 즉시 채점 및 피드백
4. **지능형 알고리즘**: 학생 이력과 문제 난이도를 고려한 추천
5. **사용 편의성**: Docker 또는 start.sh로 원클릭 실행

### 알려진 제한사항

- 메모리 기반 데이터베이스 (PostgreSQL 연동 예정)
- 기본 인증 미구현 (JWT 예정)
- 샘플 데이터 10개로 제한

### 향후 계획

- PostgreSQL 데이터베이스 연동
- JWT 인증 시스템
- 관리자 대시보드
- 문제 생성/편집 기능
- AI 기반 난이도 자동 조정
- 학습 분석 리포트

---

## 버전 형식

이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

- **MAJOR**: 호환되지 않는 API 변경
- **MINOR**: 이전 버전과 호환되는 기능 추가
- **PATCH**: 이전 버전과 호환되는 버그 수정
