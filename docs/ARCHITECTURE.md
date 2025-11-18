# 시스템 아키텍처

## 전체 구조

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)           │
│  - 문제 목록 및 선택                                   │
│  - 풀이 입력 인터페이스                                 │
│  - 분석 결과 시각화                                    │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP REST API
┌──────────────────▼──────────────────────────────────┐
│              Backend (FastAPI + Python)              │
│  ┌─────────────────────────────────────────────┐   │
│  │  API Endpoints                               │   │
│  │  - /problems  - /solutions  - /analysis     │   │
│  └────────────┬────────────────────────────────┘   │
│               │                                      │
│  ┌────────────▼────────────────────────────────┐   │
│  │  Gap Analyzer Service (핵심 로직)           │   │
│  │  - Claude AI 통합                            │   │
│  │  - 프롬프트 엔지니어링                        │   │
│  │  - 논리적 간격 정량화                         │   │
│  └────────────┬────────────────────────────────┘   │
│               │                                      │
│  ┌────────────▼────────────────────────────────┐   │
│  │  SQLAlchemy ORM Models                       │   │
│  │  - Problem, Solution, GapAnalysis           │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│           PostgreSQL Database                        │
│  - 문제 정의 및 기대 풀이                              │
│  - 학생 제출 풀이                                     │
│  - 간격 분석 결과                                     │
│  - 피드백 및 학습 진행도                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│          External: Claude AI API                     │
│  - 논리적 간격 분석                                   │
│  - 단계별 비교                                        │
│  - 피드백 생성                                        │
└─────────────────────────────────────────────────────┘
```

## 핵심 컴포넌트

### 1. Frontend (React + TypeScript)

**역할**: 사용자 인터페이스 제공

**주요 페이지**:
- `HomePage`: 랜딩 페이지, 시스템 소개
- `ProblemsPage`: 문제 목록 및 필터링
- `SolutionSubmitPage`: 단계별 풀이 입력
- `AnalysisResultsPage`: 분석 결과 시각화

**기술 스택**:
- React 18 (UI 프레임워크)
- TypeScript (타입 안정성)
- TailwindCSS (스타일링)
- Axios (API 통신)
- React Router (라우팅)

### 2. Backend API (FastAPI + Python)

**역할**: 비즈니스 로직 처리 및 데이터 관리

**API 모듈**:
- `problems.py`: 문제 CRUD
- `solutions.py`: 풀이 관리
- `analysis.py`: 간격 분석 (핵심)
- `users.py`: 사용자 관리

**서비스 레이어**:
- `gap_analyzer.py`: AI 기반 간격 분석 엔진

**기술 스택**:
- FastAPI (고성능 비동기 API)
- SQLAlchemy (ORM)
- Pydantic (데이터 검증)
- Anthropic SDK (Claude AI)

### 3. Gap Analyzer (핵심 로직)

**입력**:
- 문제 정의 (기대 풀이 단계 포함)
- 학생 제출 풀이

**처리 과정**:
1. AI 프롬프트 구성
2. Claude API 호출
3. 응답 파싱 및 검증
4. 데이터베이스 저장

**출력**:
- 완성도, 논리 연속성, 정확성 점수 (0-100)
- 발견된 간격 목록
- 단계별 비교
- 맞춤형 피드백

### 4. Database (PostgreSQL)

**주요 테이블**:

**problems**: 문제 정의
- 제목, 설명, 난이도, 과목
- 기대 풀이 단계 (JSONB)
- 기대 추론 과정

**solutions**: 학생 풀이
- 제출 단계 (JSONB)
- 원본 입력
- 상태 (DRAFT → SUBMITTED → ANALYZED)

**gap_analyses**: 분석 결과
- 점수들 (completeness, logic_continuity, correctness, overall)
- 간격 통계
- AI 요약 및 피드백

**detected_gaps**: 개별 간격
- 유형, 심각도
- 위치 (after/before step number)
- 설명 및 개선 제안

**step_comparisons**: 단계 비교
- 학생 단계 vs 기대 단계
- 유사도 점수
- 매칭 유형

**feedback_items**: 피드백
- 유형 (hint, explanation, correction, encouragement)
- 내용, 우선순위

## 데이터 흐름

### 풀이 제출 및 분석 플로우

```
1. 학생이 문제를 선택
   │
   ▼
2. 단계별 풀이 입력
   │
   ▼
3. Frontend → POST /solutions (풀이 생성)
   │
   ▼
4. Frontend → POST /solutions/{id}/submit
   │
   ▼
5. Frontend → POST /analysis/solutions/{id}
   │
   ▼
6. Backend: GapAnalyzer.analyze_solution() 호출
   │
   ▼
7. AI 프롬프트 구성
   - 문제 정보
   - 기대 단계
   - 학생 단계
   │
   ▼
8. Claude API 호출
   │
   ▼
9. AI 응답 파싱
   │
   ▼
10. 데이터베이스에 저장
    - GapAnalysis
    - DetectedGaps
    - StepComparisons
    - FeedbackItems
    │
    ▼
11. Solution 상태 업데이트 (ANALYZED)
    │
    ▼
12. Frontend: 폴링으로 결과 확인
    │
    ▼
13. 결과 시각화
```

## 확장성 고려사항

### 현재 구조의 확장 가능 영역

1. **다양한 과목 지원**
   - 데이터베이스 스키마는 이미 다중 과목 지원
   - 과목별 프롬프트 템플릿 추가 필요

2. **다국어 지원**
   - Frontend: i18n 라이브러리 추가
   - Backend: 프롬프트에 언어 파라미터 추가

3. **실시간 협업**
   - WebSocket 추가
   - 여러 학생이 동시에 풀이 공유

4. **고급 분석**
   - 학습 패턴 분석
   - 추천 시스템 (약점 기반 문제 추천)

5. **성능 최적화**
   - Redis 캐싱 (자주 조회되는 문제)
   - 비동기 작업 큐 (Celery)
   - Read replica (읽기 성능 향상)

## 보안 고려사항

- **API 인증**: 현재 미구현, JWT 토큰 인증 추가 필요
- **입력 검증**: Pydantic으로 모든 입력 검증
- **SQL Injection 방지**: SQLAlchemy ORM 사용
- **CORS**: 설정된 오리진만 허용
- **환경 변수**: 민감한 정보는 .env로 관리

## 모니터링 및 로깅

**로그 레벨**:
- INFO: 일반 요청 및 응답
- WARNING: 재시도 가능한 오류
- ERROR: 복구 불가능한 오류

**모니터링 대상**:
- API 응답 시간
- AI 분석 성공/실패율
- 데이터베이스 연결 상태
- 메모리 및 CPU 사용량
