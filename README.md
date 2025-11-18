# AI Education System - Concept Pair Warning System
# AI 교육 시스템 - 혼동 위험 개념 쌍 경고 시스템

LMS와 연동하여 학생들이 자주 혼동하는 수학 개념 쌍(예: 최댓값/최솟값 vs 절댓값)을 자동으로 감지하고 경고를 표시하는 웹 애플리케이션입니다.

A web application that integrates with LMS to automatically detect and warn about confusion-prone mathematical concept pairs (e.g., maximum/minimum vs absolute value).

## 주요 기능 / Key Features

### 1. 개념 쌍 데이터베이스 / Concept Pair Database
- 자주 혼동되는 수학 개념 쌍 저장 및 관리
- 한국어/영어 이중 언어 지원
- 난이도별, 학년별 분류

### 2. 실시간 경고 감지 / Real-time Warning Detection
- 학생 입력 텍스트에서 혼동 위험 개념 자동 감지
- 키워드, 패턴, 문맥 기반 트리거
- 중복 경고 방지 (시간 윈도우 기반)

### 3. 인터랙티브 경고 UI / Interactive Warning UI
- 시각적으로 명확한 경고 표시
- 개념 비교 및 차이점 설명
- 예시 및 구분 팁 제공
- 학생 응답 추적 (확인/무시)

### 4. 효과성 분석 / Effectiveness Analytics
- 경고 표시 횟수 추적
- 학생 개선도 측정
- 개념 쌍별 통계 제공

## 프로젝트 구조 / Project Structure

```
alt42standalone_v1.0/
├── backend/                 # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── routes/         # API 라우트
│   │   ├── services/       # 비즈니스 로직
│   │   └── types/          # TypeScript 타입 정의
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # Custom React Hooks
│   │   ├── services/      # API 서비스
│   │   └── types/         # TypeScript 타입
│   ├── package.json
│   └── vite.config.ts
│
├── database/              # Database Scripts
│   ├── migrations/        # 데이터베이스 마이그레이션
│   └── seeds/             # 초기 데이터
│
└── tasks/                 # 프로젝트 문서
    └── 0001-prd-ai-education-pipeline.md
```

## 기술 스택 / Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: pg (node-postgres)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios

## 설치 및 실행 / Installation & Setup

### 1. 환경 준비 / Prerequisites

```bash
# Node.js 20+ 설치 확인
node --version

# PostgreSQL 15+ 설치 확인
psql --version
```

### 2. 데이터베이스 설정 / Database Setup

```bash
# PostgreSQL 데이터베이스 생성
createdb ai_education

# 마이그레이션 실행
psql -d ai_education -f database/migrations/001_create_concept_pairs.sql

# 초기 데이터 입력
psql -d ai_education -f database/seeds/001_sample_concept_pairs.sql
```

### 3. Backend 설정 / Backend Setup

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 데이터베이스 연결 정보 입력

# 개발 서버 실행
npm run dev
```

Backend는 `http://localhost:3000`에서 실행됩니다.

### 4. Frontend 설정 / Frontend Setup

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

Frontend는 `http://localhost:5173`에서 실행됩니다.

## API 엔드포인트 / API Endpoints

### Concept Pairs

```
GET    /api/concept-pairs              # 모든 개념 쌍 조회
GET    /api/concept-pairs/:id          # 특정 개념 쌍 조회
POST   /api/concept-pairs              # 새 개념 쌍 생성
GET    /api/concept-pairs/:id/statistics  # 개념 쌍 통계
```

### Warnings

```
POST   /api/warnings/check             # 경고 확인
POST   /api/warnings/:id/acknowledge   # 경고 확인 응답
POST   /api/warnings/:id/effectiveness # 효과성 업데이트
```

## 데이터베이스 스키마 / Database Schema

### concept_pairs
혼동 위험 개념 쌍 정보 저장

### concept_pair_triggers
경고 트리거 조건 정의

### student_concept_warnings
학생에게 표시된 경고 기록

### concept_pair_analytics
개념 쌍별 분석 데이터

## 샘플 개념 쌍 / Sample Concept Pairs

1. **최댓값/최솟값 vs 절댓값**
   - Maximum/Minimum vs Absolute Value
   - 난이도: 높음 (High)

2. **둘레 vs 넓이**
   - Perimeter vs Area
   - 난이도: 보통 (Medium)

3. **평균 vs 중앙값**
   - Mean vs Median
   - 난이도: 보통 (Medium)

4. **소수 vs 합성수**
   - Prime vs Composite
   - 난이도: 낮음 (Low)

5. **분수 곱셈 vs 분수 덧셈**
   - Fraction Multiplication vs Addition
   - 난이도: 높음 (High)

## 사용 예시 / Usage Example

### 1. 학생이 학습 활동 진행
학생이 문제를 풀면서 텍스트를 입력합니다.

### 2. 시스템이 자동으로 개념 감지
입력된 텍스트에서 혼동 가능한 개념 쌍을 감지합니다.

### 3. 경고 표시
감지된 개념 쌍에 대한 경고를 시각적으로 표시합니다:
- 두 개념의 차이점 설명
- 각 개념의 예시
- 구분 팁 제공

### 4. 학생 응답 추적
학생의 응답(확인/무시)을 기록하고 효과성을 분석합니다.

## 개발 계획 / Development Roadmap

### Phase 1: MVP (완료 / Completed) ✅
- [x] 데이터베이스 스키마 설계
- [x] Backend API 구현
- [x] Frontend UI 구현
- [x] 기본 경고 감지 로직

### Phase 2: Enhanced Detection
- [ ] AI/LLM 기반 고급 패턴 감지
- [ ] 학습 이력 기반 개인화
- [ ] 다중 언어 지원 확장

### Phase 3: Analytics & Insights
- [ ] 대시보드 구현
- [ ] 교사용 분석 도구
- [ ] 효과성 리포트 자동 생성

### Phase 4: LMS Integration
- [ ] Canvas LMS 연동
- [ ] Moodle 연동
- [ ] LTI 표준 지원

## 라이선스 / License

MIT License

## 기여 / Contributing

이슈 및 풀 리퀘스트를 환영합니다!
Issues and pull requests are welcome!

## 문의 / Contact

KAIST Touch Math Academy
