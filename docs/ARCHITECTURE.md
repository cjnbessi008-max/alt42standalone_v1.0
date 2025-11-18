# 시스템 아키텍처

## 개요

본 시스템은 학생 풀이 과정을 추적하고 시각화하는 웹 기반 교육 플랫폼입니다.

## 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                         LMS Platform                         │
│                       (Canvas, Moodle)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │ LTI 1.3
┌───────────────────────▼─────────────────────────────────────┐
│                    API Gateway Layer                         │
│              (FastAPI - Authentication, Routing)             │
└──┬────────────────────┬────────────────────┬─────────────────┘
   │                    │                    │
┌──▼──────────────┐ ┌──▼──────────────┐ ┌──▼──────────────┐
│   Solution      │ │   Flowchart     │ │   LMS           │
│   Tracking      │ │   Generator     │ │   Integration   │
│   Service       │ │   Service       │ │   Service       │
└──┬──────────────┘ └──┬──────────────┘ └─────────────────┘
   │                   │
┌──▼───────────────────▼───────────────┐
│       Data Access Layer               │
│         (SQLAlchemy ORM)             │
└──┬────────────────────┬──────────────┘
   │                    │
┌──▼─────────────┐  ┌──▼─────────────┐
│   PostgreSQL   │  │     Redis      │
│   (Main DB)    │  │    (Cache)     │
└────────────────┘  └────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│                 (React + React Flow)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Student   │  │  Teacher   │  │ Flowchart  │           │
│  │ Dashboard  │  │ Dashboard  │  │   Viewer   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 데이터 흐름

### 1. 학생 풀이 과정 추적

```
Student Action → Frontend → Backend API → Database
    ↓
  Track Action Endpoint
    ↓
  Store in StudentAction Table
    ↓
  Update StudentSolution
```

### 2. 흐름도 생성 과정

```
Request Flowchart
    ↓
Fetch StudentActions
    ↓
FlowchartGenerator.generate_flowchart()
    ↓
  ├─ Create Start Node
  ├─ Create Action Nodes (for each action)
  ├─ Create End Node
  ├─ Create Edges (connect nodes)
  └─ Apply Layout Algorithm
    ↓
Store in FlowchartNode & FlowchartEdge tables
    ↓
Return to Frontend
    ↓
React Flow Visualization
```

### 3. LMS 연동 흐름

```
LMS Launch
    ↓
LTI Login Initiation
    ↓
OIDC Authentication
    ↓
LTI Launch (with ID Token)
    ↓
Validate Token
    ↓
Create/Get Student Record
    ↓
Create Session Token
    ↓
Redirect to Student Dashboard
```

## 주요 컴포넌트

### Backend Services

#### 1. Solution Tracking Service
- **역할**: 학생 행동 추적 및 저장
- **주요 기능**:
  - 풀이 세션 시작/종료
  - 개별 행동 기록
  - 답안 제출 처리
- **파일**: `backend/app/api/routes/student_solutions.py`

#### 2. Flowchart Generator Service
- **역할**: 학생 행동 데이터를 흐름도로 변환
- **주요 기능**:
  - 노드 생성 (시작, 행동, 결정, 종료)
  - 엣지 생성 및 연결
  - 레이아웃 알고리즘 적용
  - 스타일 적용
- **파일**: `backend/app/api/routes/flowchart.py`

#### 3. LMS Integration Service
- **역할**: LTI 1.3 표준을 통한 LMS 연동
- **주요 기능**:
  - LTI 로그인 처리
  - LTI 런치 처리
  - Grade Passback
  - Deep Linking
- **파일**: `backend/app/api/routes/lms_integration.py`

### Frontend Components

#### 1. FlowchartViewer
- **역할**: 흐름도 시각화 및 상호작용
- **기술**: React Flow
- **파일**: `frontend/src/components/FlowchartViewer.tsx`

#### 2. StudentDashboard
- **역할**: 학생의 풀이 목록 및 현황 표시
- **파일**: `frontend/src/pages/StudentDashboard.tsx`

#### 3. TeacherDashboard
- **역할**: 교사의 학생 분석 인터페이스
- **파일**: `frontend/src/pages/TeacherDashboard.tsx`

## 데이터 모델

### 핵심 엔티티 관계

```
Student ──< StudentSolution >── Problem
   │            │                  │
   │            │                  │
   │            └──< StudentAction │
   │                    │          │
   │                    │          │
   └────────────────────┘          │
                                   │
StudentSolution ──< FlowchartNode  │
        │                          │
        └──< FlowchartEdge         │
                                   │
Module >──────────────────────────┘
```

### 주요 테이블

1. **students**: 학생 정보
2. **modules**: 교육 모듈
3. **problems**: 문제
4. **student_solutions**: 풀이 세션
5. **student_actions**: 개별 행동
6. **flowchart_nodes**: 흐름도 노드
7. **flowchart_edges**: 흐름도 엣지

## 확장 가능성

### 1. AI 분석 통합
- Claude API를 사용한 학습 패턴 분석
- 개인화된 피드백 생성
- 학습 경로 추천

### 2. 실시간 협업
- WebSocket을 통한 실시간 업데이트
- 다중 학생 동시 모니터링
- 실시간 교사 개입

### 3. 고급 시각화
- D3.js 통합으로 더 복잡한 시각화
- 3D 흐름도
- 시간축 기반 애니메이션

### 4. 분석 대시보드
- 학습 패턴 통계
- 성과 예측 모델
- 개입 추천 시스템

## 성능 고려사항

### 캐싱 전략
- Redis를 사용한 자주 조회되는 흐름도 캐싱
- 세션 데이터 캐싱
- API 응답 캐싱

### 데이터베이스 최적화
- 적절한 인덱스 설정
- 쿼리 최적화
- 연결 풀링

### Frontend 최적화
- Code splitting
- Lazy loading
- Memoization
- Virtual scrolling (긴 리스트)

## 보안

### 인증 및 권한
- JWT 기반 세션 관리
- LTI 표준을 통한 SSO
- RBAC (Role-Based Access Control)

### 데이터 보호
- HTTPS 통신
- 데이터베이스 암호화
- 민감 정보 마스킹

### API 보안
- Rate limiting
- Input validation
- CORS 설정
- SQL Injection 방지
