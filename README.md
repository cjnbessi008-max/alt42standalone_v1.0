# LMS 꾸준함 점수 시각화 웹앱

LMS(Learning Management System)와 연동하여 학생들의 꾸준함 점수를 계산하고 시각화하는 독립형 웹 애플리케이션입니다.

## 주요 기능

- **꾸준함 점수 계산**: 출석률(30%), 학습활동빈도(40%), 과제제출간격(30%)을 기반으로 종합 점수 계산
- **개인별 분석**: 각 학생의 꾸준함 점수 추이를 시계열 그래프로 시각화
- **전체 비교**: 모든 학생의 점수를 순위별로 비교
- **실시간 대시보드**: Material-UI 기반의 직관적인 인터페이스
- **Mock LMS 데이터**: 테스트를 위한 모의 데이터 자동 생성

## 기술 스택

### Backend
- Node.js + Express + TypeScript
- SQLite (경량 데이터베이스)
- better-sqlite3 (동기 SQLite 드라이버)
- date-fns (날짜 처리)

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Material-UI (UI 컴포넌트)
- Recharts (차트 라이브러리)
- Zustand (상태 관리)
- Axios (HTTP 클라이언트)

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                # 백엔드 서버
│   ├── src/
│   │   ├── index.ts       # Express 서버 진입점
│   │   ├── database.ts    # 데이터베이스 초기화
│   │   ├── consistency.ts # 꾸준함 점수 계산 로직
│   │   └── seed.ts        # Mock 데이터 생성
│   ├── data/              # SQLite 데이터베이스 파일 (자동 생성)
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ScoreTrendChart.tsx
│   │   │   ├── StudentList.tsx
│   │   │   ├── ScoreCard.tsx
│   │   │   └── StudentComparisonTable.tsx
│   │   ├── App.tsx        # 메인 App 컴포넌트
│   │   ├── main.tsx       # 진입점
│   │   ├── types.ts       # TypeScript 타입 정의
│   │   ├── api.ts         # API 클라이언트
│   │   └── store.ts       # Zustand 스토어
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## 설치 및 실행

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 1. 의존성 설치

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Mock 데이터 생성

```bash
cd backend
npm run seed
```

이 명령어는 다음을 수행합니다:
- 8명의 학생 데이터 생성
- 과거 60일간의 출석 기록 생성
- 학습 활동 기록 생성
- 과제 및 제출 기록 생성
- 꾸준함 점수 계산 및 저장

### 3. 애플리케이션 실행

#### Backend 서버 시작 (터미널 1)
```bash
cd backend
npm run dev
```

서버는 `http://localhost:3001`에서 실행됩니다.

#### Frontend 서버 시작 (터미널 2)
```bash
cd frontend
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

### 4. 브라우저에서 접속

웹 브라우저에서 `http://localhost:3000`을 열어 대시보드를 확인하세요.

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/students` | 모든 학생 목록 조회 |
| GET | `/api/students/:id` | 특정 학생 정보 조회 |
| GET | `/api/students/:id/scores` | 학생의 점수 추이 조회 (query: days) |
| GET | `/api/scores/latest` | 모든 학생의 최신 점수 조회 |
| POST | `/api/scores/calculate` | 꾸준함 점수 재계산 |
| GET | `/api/health` | 서버 상태 확인 |

## 꾸준함 점수 계산 방식

### 출석 점수 (30%)
```
(출석일수 + 지각일수 × 0.5) / 전체일수 × 100
```

### 활동 점수 (40%)
```
min(평균 일일 활동 수 / 목표 활동 수 × 100, 100)
목표: 하루 6개 활동
```

### 과제 점수 (30%)
```
(제시간 제출 + 지각 제출 × 0.7) / 전체 과제 × 100
```

### 총점
```
출석점수 × 0.3 + 활동점수 × 0.4 + 과제점수 × 0.3
```

## 화면 구성

### 1. 개인별 분석 탭
- 왼쪽: 학생 목록
- 오른쪽: 선택된 학생의 점수 카드 및 추이 그래프
- 4가지 점수: 총점, 출석, 활동, 과제

### 2. 전체 비교 탭
- 모든 학생의 점수를 순위별로 표시
- 상위 3명 강조 표시 (🥇🥈🥉)
- 점수별 색상 구분 (초록/주황/빨강)

## 개발 스크립트

### Backend
```bash
npm run dev      # 개발 서버 실행 (hot reload)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run seed     # Mock 데이터 생성
```

### Frontend
```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드된 앱 미리보기
npm run lint     # ESLint 실행
```

## Mock 데이터 패턴

- **학생 1-2**: 매우 꾸준함 (95% 출석, 8-10 활동/일, 100% 제출)
- **학생 3-5**: 보통 꾸준함 (85% 출석, 5-8 활동/일, 90% 제출)
- **학생 6-8**: 덜 꾸준함 (70% 출석, 2-6 활동/일, 70% 제출)

## 추후 확장 가능성

- [ ] 실제 LMS API 연동 (Canvas, Moodle, Blackboard)
- [ ] 사용자 인증 및 권한 관리
- [ ] 알림 기능 (점수 하락 시 경고)
- [ ] 데이터 내보내기 (CSV, Excel)
- [ ] 기간별 통계 (주간, 월간, 학기별)
- [ ] 반별 비교 분석
- [ ] 개선 제안 AI 기능

## 라이선스

MIT

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.
