# 개념-문제 매칭 및 추천 시스템 (독립형 웹앱)

AI 기반 하이브리드 추천 알고리즘을 활용한 학생 맞춤형 학습 시스템

## 🚀 주요 기능

### 1. **하이브리드 추천 알고리즘**
- **컨텐츠 기반 필터링**: 개념 유사도 및 난이도 매칭
- **협업 필터링**: 유사한 학생들의 학습 패턴 분석
- **지식 그래프**: 선수 개념 및 학습 경로 기반 추천

### 2. **인터랙티브 시각화**
- D3.js 기반 개념-문제 관계 그래프
- 줌, 팬, 드래그 기능
- 실시간 필터링 (카테고리, 난이도)

### 3. **학습 분석**
- 학생별 성취도 추적
- 강점/약점 개념 자동 파악
- 학습 패턴 분석

### 4. **독립형 실행**
- SQLite 기반 (외부 DB 불필요)
- Node.js + React 단일 스택
- 간편한 설치 및 실행

## 📋 기술 스택

### Backend
- **Node.js + Express**: REST API 서버
- **SQLite (better-sqlite3)**: 독립형 데이터베이스
- **추천 엔진**: 자체 구현 하이브리드 알고리즘

### Frontend
- **React 18 + TypeScript**: UI 프레임워크
- **Vite**: 빌드 도구
- **D3.js**: 데이터 시각화
- **Tailwind CSS**: 스타일링
- **Axios**: API 통신

## 🔧 설치 및 실행

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 1. 프로젝트 클론 및 설치

```bash
cd webapp
npm run setup
```

### 2. 데이터베이스 초기화 및 샘플 데이터 삽입

```bash
cd backend
npm run init-db
npm run seed
```

### 3. 개발 서버 실행

```bash
# webapp 루트 디렉토리에서 (백엔드 + 프론트엔드 동시 실행)
npm run dev

# 또는 개별 실행
npm run dev:backend  # 백엔드만 (포트 3001)
npm run dev:frontend # 프론트엔드만 (포트 5173)
```

### 4. 브라우저에서 접속

```
http://localhost:5173
```

## 📂 프로젝트 구조

```
webapp/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── schema.js          # SQLite 스키마 정의
│   │   │   ├── init.js            # DB 초기화 스크립트
│   │   │   └── seed.js            # 샘플 데이터
│   │   ├── routes/
│   │   │   ├── concepts.js        # 개념 API
│   │   │   ├── problems.js        # 문제 API
│   │   │   ├── students.js        # 학생 API
│   │   │   ├── progress.js        # 진도 API
│   │   │   ├── recommendations.js # 추천 API
│   │   │   ├── graph.js           # 그래프 데이터 API
│   │   │   └── analytics.js       # 분석 API
│   │   ├── services/
│   │   │   └── recommendationEngine.js  # 추천 알고리즘
│   │   └── server.js              # Express 서버
│   ├── data/
│   │   └── concepts.db            # SQLite 데이터베이스 (자동 생성)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx         # 네비게이션 바
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # 홈 페이지 (학생 목록)
│   │   │   ├── StudentDashboard.tsx  # 학생 대시보드 (추천 + 분석)
│   │   │   └── VisualizationPage.tsx # D3.js 시각화
│   │   ├── services/
│   │   │   └── api.ts             # API 통신 모듈
│   │   ├── App.tsx                # 메인 앱
│   │   └── main.tsx               # 엔트리 포인트
│   └── package.json
└── package.json                   # 루트 package.json
```

## 🎯 주요 API 엔드포인트

### 개념 (Concepts)
```
GET  /api/concepts                    # 모든 개념 조회
GET  /api/concepts/:id                # 개념 상세
GET  /api/concepts/:id/problems       # 개념별 문제 목록
GET  /api/concepts/:id/prerequisites  # 선수 개념
```

### 문제 (Problems)
```
GET  /api/problems                    # 모든 문제 조회
GET  /api/problems/:id                # 문제 상세
GET  /api/problems/:id/concepts       # 문제 관련 개념
```

### 학생 (Students)
```
GET  /api/students                    # 학생 목록
GET  /api/students/:id                # 학생 정보
POST /api/students                    # 학생 생성
```

### 추천 (Recommendations)
```
GET  /api/recommendations/:studentId  # 학생별 추천 문제
```
**쿼리 파라미터**:
- `limit`: 추천 개수 (기본 10)
- `min_confidence`: 최소 신뢰도 (0-1, 기본 0.5)
- `algorithm`: 알고리즘 필터 (content, collaborative, knowledge_graph, hybrid)

### 진도 (Progress)
```
GET  /api/progress/:studentId         # 학생 진도 조회
POST /api/progress/:studentId         # 진도 기록/업데이트
GET  /api/progress/:studentId/concepts # 개념별 성취도
```

### 그래프 (Graph)
```
GET  /api/graph                       # 시각화용 그래프 데이터
GET  /api/graph/learning-path/:studentId  # 학습 경로
```

### 분석 (Analytics)
```
GET  /api/analytics/:studentId        # 학생 학습 분석
GET  /api/analytics/:studentId/compare # 또래 비교
```

## 📊 샘플 데이터

시스템에는 다음 샘플 데이터가 포함되어 있습니다:

- **개념 10개**: 분수, 소수 관련 개념
- **문제 15개**: 다양한 난이도의 수학 문제
- **학생 4명**: 김철수, 이영희, 박민수, 최지현
- **진도 데이터**: 학생별 문제 풀이 기록

## 🧪 추천 알고리즘 상세

### 1. 컨텐츠 기반 필터링
- 약점 개념 파악 (낮은 점수, 미완료 상태)
- 난이도 매칭
- 연관도 점수 기반 문제 선택

### 2. 협업 필터링
- 같은 학년, 유사한 성적의 학생 찾기
- 유사 학생이 성공한 문제 추천
- 성취도 기반 신뢰도 계산

### 3. 지식 그래프
- 선수 개념 체크
- 필수 선수 학습 먼저 추천
- 점진적 난이도 상승

### 하이브리드 조합
- 가중 평균: 컨텐츠(40%) + 협업(30%) + 지식그래프(30%)
- 중복 제거 및 신뢰도 정규화
- 상위 N개 추천

## 🎨 주요 화면

### 1. 홈 페이지
- 시스템 소개
- 학생 목록 및 통계

### 2. 학생 대시보드
- 개인 학습 통계
- AI 추천 문제 (신뢰도 및 이유 표시)
- 강점/약점 개념 분석

### 3. 시각화 페이지
- D3.js 인터랙티브 그래프
- 개념(녹색 노드) ↔ 문제(파란색 노드)
- 필터링 및 탐색 기능

## 🔨 개발 가이드

### 데이터베이스 초기화 (리셋)

```bash
cd backend
npm run init-db -- --reset
npm run seed
```

### 백엔드만 실행

```bash
cd backend
npm run dev
# 서버: http://localhost:3001
```

### 프론트엔드만 실행

```bash
cd frontend
npm run dev
# 앱: http://localhost:5173
```

### 빌드

```bash
# 루트에서 전체 빌드
npm run build

# 개별 빌드
npm run build:frontend
npm run build:backend
```

## 📝 환경 변수

백엔드 `.env` 파일 (`backend/.env`):

```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/concepts.db
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🐛 문제 해결

### 데이터베이스 파일이 없음
```bash
cd backend
npm run init-db
npm run seed
```

### 포트 충돌
- `.env` 파일에서 `PORT` 변경
- 프론트엔드 포트는 `vite.config.ts`에서 변경

### 추천 결과가 없음
- 샘플 데이터 확인: `npm run seed`
- 학생 진도 데이터가 충분한지 확인

## 📚 참고 자료

- [Express 공식 문서](https://expressjs.com/)
- [React 공식 문서](https://react.dev/)
- [D3.js 공식 문서](https://d3js.org/)
- [SQLite 문서](https://www.sqlite.org/docs.html)

## 🤝 기여

버그 리포트 및 기능 제안은 Issues를 통해 제출해 주세요.

## 📄 라이선스

MIT License

---

**개발**: AI Education System Pipeline
**버전**: 1.0.0
**마지막 업데이트**: 2025-11-18
